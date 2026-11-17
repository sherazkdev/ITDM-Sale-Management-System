import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import ExcelJS from "exceljs";
import type { AppEnv } from "../config/env.js";
import type { Logger } from "../logging/logger.js";
import {
  OFFICIAL_TEMPLATE_MIN_BYTES,
  OFFICIAL_TEMPLATE_SHA256,
} from "./official-template-hashes.js";

const DEFAULT_B64_ISSUANCE = "/etc/secrets/Issuance.xlsx.b64";
const DEFAULT_B64_RETURN = "/etc/secrets/Return.xlsx.b64";
const DEFAULT_DECODE_DIR = "/tmp/itdms-templates";

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function verifyWorkbookOpenable(filePath: string): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  if (workbook.worksheets.length < 1) {
    throw new Error("Official template has no worksheets");
  }
}

async function decodeB64SecretFile(
  b64Path: string,
  outputFileName: string,
  expectedSha256: string,
  decodeDir: string,
  logger: Logger,
  label: string,
): Promise<string> {
  const encoded = (await fs.readFile(b64Path, "utf8")).trim();
  if (!encoded || encoded.length < 100) {
    throw new Error(`Official template base64 file is empty: ${b64Path}`);
  }
  const buffer = Buffer.from(encoded, "base64");
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const skipHash = process.env.ITDMS_OFFICIAL_TEMPLATE_SKIP_HASH === "1";
  if (!skipHash && sha256 !== expectedSha256) {
    throw new Error(`Official template SHA-256 mismatch for ${label}`);
  }
  if (buffer.length < OFFICIAL_TEMPLATE_MIN_BYTES) {
    throw new Error(`Official template too small for ${label}`);
  }
  await fs.mkdir(decodeDir, { recursive: true });
  const outPath = path.join(decodeDir, outputFileName);
  await fs.writeFile(outPath, buffer);
  await verifyWorkbookOpenable(outPath);
  logger.info(
    { label, b64Path, outPath, bytes: buffer.length, sha256 },
    "Official template decoded from Render secret file",
  );
  return outPath;
}

async function writeFromInlineB64(
  targetPath: string,
  b64: string,
  expectedSha256: string,
  logger: Logger,
  label: string,
): Promise<void> {
  const buffer = Buffer.from(b64, "base64");
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const skipHash = process.env.ITDMS_OFFICIAL_TEMPLATE_SKIP_HASH === "1";
  if (!skipHash && sha256 !== expectedSha256) {
    throw new Error(`Official template SHA-256 mismatch for ${label} (inline env)`);
  }
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, buffer);
  await verifyWorkbookOpenable(targetPath);
  logger.info({ label, targetPath, bytes: buffer.length, sha256 }, "Official template restored from inline env");
}

/**
 * Must run before `loadEnv()` cache is populated (mutates process.env paths).
 */
export async function bootstrapOfficialTemplatesPreEnv(logger: Logger): Promise<void> {
  const decodeDir =
    process.env.ITDMS_TEMPLATES_DECODE_DIR?.trim() || DEFAULT_DECODE_DIR;
  const issuanceB64Path =
    process.env.ITDMS_ISSUANCE_TEMPLATE_B64_PATH?.trim() || DEFAULT_B64_ISSUANCE;
  const returnB64Path =
    process.env.ITDMS_RETURN_TEMPLATE_B64_PATH?.trim() || DEFAULT_B64_RETURN;

  if (await fileExists(issuanceB64Path)) {
    const out = await decodeB64SecretFile(
      issuanceB64Path,
      "Issuance.xlsx",
      OFFICIAL_TEMPLATE_SHA256.issuance,
      decodeDir,
      logger,
      "issuance",
    );
    process.env.ITDMS_ISSUANCE_TEMPLATE_PATH = out;
  }

  if (await fileExists(returnB64Path)) {
    const out = await decodeB64SecretFile(
      returnB64Path,
      "Return.xlsx",
      OFFICIAL_TEMPLATE_SHA256.return,
      decodeDir,
      logger,
      "return",
    );
    process.env.ITDMS_RETURN_TEMPLATE_PATH = out;
  }

  const issuanceInline = process.env.ITDMS_ISSUANCE_TEMPLATE_B64?.trim();
  const returnInline = process.env.ITDMS_RETURN_TEMPLATE_B64?.trim();
  if (issuanceInline) {
    const target =
      process.env.ITDMS_ISSUANCE_TEMPLATE_PATH ??
      path.join(decodeDir, "Issuance.xlsx");
    await writeFromInlineB64(
      target,
      issuanceInline,
      OFFICIAL_TEMPLATE_SHA256.issuance,
      logger,
      "issuance",
    );
    process.env.ITDMS_ISSUANCE_TEMPLATE_PATH = target;
  }
  if (returnInline) {
    const target =
      process.env.ITDMS_RETURN_TEMPLATE_PATH ?? path.join(decodeDir, "Return.xlsx");
    await writeFromInlineB64(
      target,
      returnInline,
      OFFICIAL_TEMPLATE_SHA256.return,
      logger,
      "return",
    );
    process.env.ITDMS_RETURN_TEMPLATE_PATH = target;
  }
}

export async function bootstrapOfficialTemplates(env: AppEnv, logger: Logger): Promise<void> {
  for (const [label, p] of [
    ["issuance", env.ITDMS_ISSUANCE_TEMPLATE_PATH],
    ["return", env.ITDMS_RETURN_TEMPLATE_PATH],
  ] as const) {
    if (!p) {
      logger.warn({ label }, "Official template path not configured");
      continue;
    }
    try {
      const st = await fs.stat(p);
      if (!st.isFile() || st.size < OFFICIAL_TEMPLATE_MIN_BYTES) {
        logger.warn({ label, path: p, size: st.size }, "Official template path looks invalid");
      }
    } catch {
      logger.warn(
        { label, path: p },
        "Official template file not present — official XLSX export returns 404 until provisioned",
      );
    }
  }
}
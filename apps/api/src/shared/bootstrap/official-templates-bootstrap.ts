import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import type { AppEnv } from "../config/env.js";
import type { Logger } from "../logging/logger.js";

async function writeIfMissing(
  targetPath: string,
  buffer: Buffer,
  logger: Logger,
  label: string,
): Promise<void> {
  try {
    await fs.access(targetPath);
    return;
  } catch {
    // create
  }
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, buffer);
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  logger.info({ label, targetPath, bytes: buffer.length, sha256 }, "Official template restored at startup");
}

/**
 * Optional Render bootstrap: decode base64 env payloads into ephemeral template paths.
 * Large client templates should use Render Secret Files instead of env vars.
 */
export async function bootstrapOfficialTemplates(env: AppEnv, logger: Logger): Promise<void> {
  const issuanceB64 = process.env.ITDMS_ISSUANCE_TEMPLATE_B64?.trim();
  const returnB64 = process.env.ITDMS_RETURN_TEMPLATE_B64?.trim();

  if (issuanceB64 && env.ITDMS_ISSUANCE_TEMPLATE_PATH) {
    await writeIfMissing(env.ITDMS_ISSUANCE_TEMPLATE_PATH, Buffer.from(issuanceB64, "base64"), logger, "issuance");
  }
  if (returnB64 && env.ITDMS_RETURN_TEMPLATE_PATH) {
    await writeIfMissing(env.ITDMS_RETURN_TEMPLATE_PATH, Buffer.from(returnB64, "base64"), logger, "return");
  }

  for (const [label, p] of [
    ["issuance", env.ITDMS_ISSUANCE_TEMPLATE_PATH],
    ["return", env.ITDMS_RETURN_TEMPLATE_PATH],
  ] as const) {
    if (!p) continue;
    try {
      const st = await fs.stat(p);
      if (!st.isFile() || st.size < 1024) {
        logger.warn({ label, path: p, size: st.size }, "Official template path looks invalid");
      }
    } catch {
      logger.warn({ label, path: p }, "Official template file not present — official XLSX export blocked until provisioned");
    }
  }
}
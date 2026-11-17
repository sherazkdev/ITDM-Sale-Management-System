import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { pino } from "pino";
import { bootstrapOfficialTemplatesPreEnv } from "../src/shared/bootstrap/official-templates-bootstrap.js";
import { resetEnvCache } from "../src/shared/config/env.js";
import { OFFICIAL_TEMPLATE_SHA256 } from "../src/shared/bootstrap/official-template-hashes.js";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "../../..");

describe("official templates bootstrap", () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), "itdms-tpl-"));
  });

  afterEach(async () => {
    delete process.env.ITDMS_ISSUANCE_TEMPLATE_B64_PATH;
    delete process.env.ITDMS_RETURN_TEMPLATE_B64_PATH;
    delete process.env.ITDMS_TEMPLATES_DECODE_DIR;
    delete process.env.ITDMS_ISSUANCE_TEMPLATE_PATH;
    delete process.env.ITDMS_RETURN_TEMPLATE_PATH;
    resetEnvCache();
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it("decodes issuance/return b64 secret files with SHA-256 verification", async () => {
    const issuanceSrc = path.join(repoRoot, "storage/client-templates/Issuance.xlsx");
    const returnSrc = path.join(repoRoot, "storage/client-templates/Return.xlsx");
    const issuanceB64 = (await fs.readFile(issuanceSrc)).toString("base64");
    const returnB64 = (await fs.readFile(returnSrc)).toString("base64");
    const secretsDir = path.join(tmp, "secrets");
    const decodeDir = path.join(tmp, "decoded");
    await fs.mkdir(secretsDir, { recursive: true });
    await fs.writeFile(path.join(secretsDir, "Issuance.xlsx.b64"), issuanceB64);
    await fs.writeFile(path.join(secretsDir, "Return.xlsx.b64"), returnB64);

    process.env.ITDMS_ISSUANCE_TEMPLATE_B64_PATH = path.join(secretsDir, "Issuance.xlsx.b64");
    process.env.ITDMS_RETURN_TEMPLATE_B64_PATH = path.join(secretsDir, "Return.xlsx.b64");
    process.env.ITDMS_TEMPLATES_DECODE_DIR = decodeDir;

    const logger = pino({ level: "silent" });
    await bootstrapOfficialTemplatesPreEnv(logger);

    const issuanceOut = process.env.ITDMS_ISSUANCE_TEMPLATE_PATH;
    const returnOut = process.env.ITDMS_RETURN_TEMPLATE_PATH;
    expect(issuanceOut).toBe(path.join(decodeDir, "Issuance.xlsx"));
    expect(returnOut).toBe(path.join(decodeDir, "Return.xlsx"));

    const { createHash } = await import("node:crypto");
    const iBuf = await fs.readFile(issuanceOut!);
    const rBuf = await fs.readFile(returnOut!);
    expect(createHash("sha256").update(iBuf).digest("hex")).toBe(OFFICIAL_TEMPLATE_SHA256.issuance);
    expect(createHash("sha256").update(rBuf).digest("hex")).toBe(OFFICIAL_TEMPLATE_SHA256.return);
  });
});
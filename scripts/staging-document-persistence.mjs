#!/usr/bin/env node
/**
 * Staging document persistence: upload → DB + disk → Postgres restart → download integrity.
 * Optional backup manifest check (ITDMS_BACKUP_INCLUDE_STORAGE=1).
 * Refuses non-staging DATABASE_URL.
 */
import { createHash } from "node:crypto";
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const stagingEnv = resolve(root, "apps/api/.env.staging");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(stagingEnv);

const base = (process.env.STAGING_API_BASE ?? `http://127.0.0.1:${process.env.PORT ?? 3002}`).replace(
  /\/$/,
  "",
);
const CSRF = { "x-itdms-requested-with": "itdms" };
const adminUser = process.env.STAGING_UAT_ADMIN_USER ?? "uat.admin";
const adminPass = process.env.STAGING_UAT_ADMIN_PASSWORD ?? "StagingUatAdmin-ChangeMe!";
const dbUrl = process.env.DATABASE_URL;
const storageRootRel = process.env.STORAGE_ROOT ?? "./storage-staging";
const storageRoot = resolve(root, "apps/api", storageRootRel.replace(/^\.\//, ""));

async function login() {
  const res = await fetch(`${base}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", ...CSRF },
    body: JSON.stringify({ username: adminUser, password: adminPass }),
  });
  if (!res.ok) throw new Error(`login ${res.status}`);
  return res.headers.getSetCookie?.()?.map((c) => c.split(";")[0]).join("; ") ?? "";
}

async function readyOk() {
  const res = await fetch(`${base}/api/v1/health/ready`);
  return res.ok;
}

function sha256Buffer(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

const started = Date.now();
try {
  if (!dbUrl?.includes("itdms_staging")) {
    throw new Error("Refusing: DATABASE_URL must be itdms_staging");
  }
  if (!storageRoot.includes("storage-staging")) {
    throw new Error(`Refusing: STORAGE_ROOT must be storage-staging, got ${storageRootRel}`);
  }

  const cookie = await login();
  const ts = Date.now();
  const payloadText = `ITDMS Phase05 staging doc ${ts}\n`;
  const payloadB64 = Buffer.from(payloadText, "utf8").toString("base64");
  const expectedSha = sha256Buffer(Buffer.from(payloadText, "utf8"));

  const vendorRes = await fetch(`${base}/api/v1/vendors`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json", ...CSRF },
    body: JSON.stringify({ vendorName: `DocPersist-V-${ts}` }),
  });
  if (!vendorRes.ok) throw new Error(`vendor create ${vendorRes.status}`);
  const vendor = (await vendorRes.json()).data;

  const poRes = await fetch(`${base}/api/v1/purchase-orders`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json", ...CSRF },
    body: JSON.stringify({
      poNumber: `PO-DOC-${ts}`,
      vendorId: vendor.vendorId,
      poDate: "2026-11-03",
      currency: "USD",
    }),
  });
  if (!poRes.ok) throw new Error(`po create ${poRes.status}`);
  const po = (await poRes.json()).data;

  const uploadRes = await fetch(`${base}/api/v1/documents/uploads`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json", ...CSRF },
    body: JSON.stringify({
      ownerType: "purchase_order",
      ownerId: String(po.purchaseOrderId),
      originalFileName: `phase05-${ts}.txt`,
      mimeType: "text/plain",
      contentBase64: payloadB64,
    }),
  });
  if (!uploadRes.ok) throw new Error(`upload ${uploadRes.status}`);
  const doc = (await uploadRes.json()).data;
  const docId = doc.storedDocumentId ?? doc.stored_document_id;

  const client = new pg.Client({ connectionString: dbUrl });
  let storageKey;
  let dbSha;
  try {
    await client.connect();
    const row = await client.query(
      "SELECT storage_key, sha256 FROM stored_documents WHERE stored_document_id = $1",
      [docId],
    );
    if (row.rowCount !== 1) throw new Error("document row missing in DB");
    storageKey = String(row.rows[0].storage_key).replace(/\\/g, "/");
    dbSha = String(row.rows[0].sha256);
  } finally {
    await client.end().catch(() => undefined);
  }
  if (dbSha !== expectedSha) throw new Error("DB sha256 mismatch");

  const fullPath = resolve(storageRoot, storageKey);
  if (!fullPath.startsWith(storageRoot)) throw new Error("storage path escapes root");
  if (!existsSync(fullPath)) throw new Error(`file missing on disk: ${storageKey}`);
  const diskSha = sha256Buffer(readFileSync(fullPath));
  if (diskSha !== expectedSha) throw new Error("disk sha256 mismatch");

  const devStorage = resolve(root, "apps/api/storage");
  const testStorage = resolve(root, "apps/api/storage-test");
  const devCopy = resolve(devStorage, storageKey);
  const testCopy = resolve(testStorage, storageKey);
  if (existsSync(devCopy) || existsSync(testCopy)) {
    throw new Error("storage path isolation failed — file also visible under dev/test roots");
  }

  const restart = spawnSync("docker", ["restart", "itdms-postgres-staging"], { encoding: "utf8" });
  if (restart.status !== 0) throw new Error("docker restart postgres failed");

  for (let i = 0; i < 45; i++) {
    if (await readyOk()) break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!(await readyOk())) throw new Error("API not ready after DB restart");

  const cookie2 = await login();
  const dl = await fetch(`${base}/api/v1/documents/${docId}/download`, {
    headers: { cookie: cookie2, ...CSRF },
  });
  if (!dl.ok) throw new Error(`download ${dl.status}`);
  const dlBuf = Buffer.from(await dl.arrayBuffer());
  if (sha256Buffer(dlBuf) !== expectedSha) throw new Error("download content mismatch");

  let backupManifestOk = null;
  if (process.env.ITDMS_RUN_STAGING_BACKUP_CHECK === "1") {
    const backup = spawnSync(
      "node",
      ["scripts/backup-itdms.mjs"],
      {
        cwd: root,
        encoding: "utf8",
        env: {
          ...process.env,
          DATABASE_URL: dbUrl,
          STORAGE_ROOT: join("apps", "api", "storage-staging"),
          BACKUP_DIR: join(root, "backups/staging"),
          ITDMS_PG_CONTAINER: "itdms-postgres-staging",
          ITDMS_BACKUP_INCLUDE_STORAGE: "1",
        },
      },
    );
    backupManifestOk = backup.status === 0;
    if (!backupManifestOk) throw new Error("staging backup script failed");
  }

  console.log(
    JSON.stringify({
      ok: true,
      durationMs: Date.now() - started,
      storedDocumentId: String(docId),
      storageKey,
      storageRoot: storageRootRel,
      postgresRestart: "itdms-postgres-staging",
      downloadSha256: expectedSha,
      backupCheckRun: process.env.ITDMS_RUN_STAGING_BACKUP_CHECK === "1",
      backupManifestOk,
      note: "API process restart not required for file persistence; files live on STORAGE_ROOT volume",
    }),
  );
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err), durationMs: Date.now() - started }));
  process.exit(1);
}

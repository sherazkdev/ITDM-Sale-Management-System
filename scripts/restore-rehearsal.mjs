#!/usr/bin/env node
/**
 * Isolated restore rehearsal for local Docker Postgres.
 * Creates NEW database itdms_restore_test — does NOT modify itdms_dev.
 *
 * Usage: node scripts/restore-rehearsal.mjs path/to/itdms-db-*.sql
 */
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

function log(event, fields = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...fields }));
}

function quoteIdent(name) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    throw new Error("Invalid database identifier");
  }
  return `"${name}"`;
}

function dockerExec(args, input) {
  return spawnSync("docker", ["exec", "-i", container, ...args], {
    encoding: "utf8",
    input,
  });
}

const backupFile = process.argv[2];
if (!backupFile || !existsSync(backupFile)) {
  log("restore_failed", { reason: "Provide path to SQL backup as argv[2]" });
  process.exit(1);
}

const container = process.env.ITDMS_PG_CONTAINER ?? "itdms-postgres";
const pgUser = process.env.ITDMS_PG_USER ?? "itdms";
const restoreDb = process.env.ITDMS_RESTORE_DB ?? "itdms_restore_test";
const adminUrl =
  process.env.ITDMS_PG_ADMIN_URL ??
  `postgresql://${pgUser}:itdms_dev_password@127.0.0.1:5433/postgres`;

const started = Date.now();

const admin = new pg.Client({ connectionString: adminUrl });
try {
  await admin.connect();
  await admin
    .query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1`, [restoreDb])
    .catch(() => undefined);
  await admin.query(`DROP DATABASE IF EXISTS ${quoteIdent(restoreDb)}`);
  await admin.query(`CREATE DATABASE ${quoteIdent(restoreDb)} OWNER ${quoteIdent(pgUser)}`);
} finally {
  await admin.end().catch(() => undefined);
}

const sql = readFileSync(backupFile, "utf8");
if (!sql.includes("PostgreSQL database dump")) {
  log("restore_failed", { reason: "Invalid backup header" });
  process.exit(1);
}

const restore = dockerExec(["psql", "-U", pgUser, "-d", restoreDb, "-v", "ON_ERROR_STOP=1"], sql);
if (restore.status !== 0) {
  log("restore_failed", {
    reason: "psql restore failed",
    stderr: restore.stderr?.slice(0, 2000),
  });
  process.exit(1);
}

const verifyUrl = `postgresql://${pgUser}:itdms_dev_password@127.0.0.1:5433/${restoreDb}`;
const client = new pg.Client({ connectionString: verifyUrl });
const counts = {};
let documentSample = [];
try {
  await client.connect();
  for (const t of [
    "employees",
    "assets",
    "non_asset_stock_items",
    "purchase_orders",
    "stored_documents",
    "document_links",
    "users",
  ]) {
    const r = await client.query(`SELECT COUNT(*)::int AS c FROM ${t}`);
    counts[t] = r.rows[0].c;
  }
  const fk = await client.query(`
    SELECT COUNT(*)::int AS violations FROM (
      SELECT 1 FROM document_links dl
      LEFT JOIN stored_documents sd ON sd.stored_document_id = dl.stored_document_id
      WHERE sd.stored_document_id IS NULL
    ) x
  `);
  counts.document_link_fk_violations = fk.rows[0].violations;

  const docs = await client.query(
    `SELECT stored_document_id, storage_key, sha256 FROM stored_documents ORDER BY stored_document_id DESC LIMIT 5`,
  );
  documentSample = docs.rows;

  const storageRoot = resolve(process.env.STORAGE_ROOT ?? join(repoRoot, "apps/api/storage"));
  const storageTestRoot = resolve(repoRoot, "apps/api/storage-test");

  let filesResolved = 0;
  let filesMissing = 0;
  const missingKeys = [];
  for (const row of documentSample) {
    const key = String(row.storage_key).replace(/\\/g, "/");
    const full = resolve(storageRoot, key);
    const alt = resolve(storageTestRoot, key);
    if (existsSync(full) || existsSync(alt)) {
      filesResolved++;
    } else {
      filesMissing++;
      missingKeys.push({ storageKey: key, storedDocumentId: row.stored_document_id });
    }
  }

  let fullPresent = 0;
  let fullMissing = 0;
  const allDocs = await client.query("SELECT storage_key FROM stored_documents");
  for (const row of allDocs.rows) {
    const key = String(row.storage_key).replace(/\\/g, "/");
    if (existsSync(resolve(storageRoot, key)) || existsSync(resolve(storageTestRoot, key))) {
      fullPresent++;
    } else {
      fullMissing++;
    }
  }

  log("restore_rehearsal_complete", {
    durationMs: Date.now() - started,
    restoreDatabase: restoreDb,
    sourceDevDatabaseUntouched: "itdms_dev",
    rowCounts: counts,
    documentSampleCount: documentSample.length,
    storageFilesResolved: filesResolved,
    storageFilesMissing: filesMissing,
    missingSample: missingKeys,
    documentFilesPresent: fullPresent,
    documentFilesMissing: fullMissing,
    storageRootsChecked: [storageRoot, storageTestRoot],
    note:
      fullMissing > 0
        ? "Missing files: often test uploads in storage-test while backup omits files, or pre-existing orphan metadata in shared itdms_dev"
        : "All restored document keys resolved on disk",
  });
} finally {
  await client.end().catch(() => undefined);
}

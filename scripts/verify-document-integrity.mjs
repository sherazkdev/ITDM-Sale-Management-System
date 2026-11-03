#!/usr/bin/env node
/**
 * Compare stored_documents.storage_key rows to files under STORAGE_ROOT.
 * Exit 1 when any referenced file is missing (operational integrity check).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const envPath = resolve(repoRoot, "apps/api/.env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key] === undefined) {
      process.env[key] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
}

const url = process.env.DATABASE_URL;
const storageRoot = resolve(process.env.STORAGE_ROOT ?? resolve(repoRoot, "apps/api/storage"));
if (!url) {
  console.error(JSON.stringify({ ok: false, error: "DATABASE_URL required" }));
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
const missing = [];
let present = 0;
try {
  await client.connect();
  const r = await client.query(
    "SELECT stored_document_id, storage_key, sha256 FROM stored_documents ORDER BY stored_document_id",
  );
  for (const row of r.rows) {
    const key = String(row.storage_key).replace(/\\/g, "/");
    const full = resolve(storageRoot, key);
    if (existsSync(full)) {
      present++;
    } else {
      missing.push({
        storedDocumentId: row.stored_document_id,
        storageKey: key,
      });
    }
  }
  console.log(
    JSON.stringify({
      ok: missing.length === 0,
      storageRoot,
      total: r.rows.length,
      present,
      missingCount: missing.length,
      missing: missing.slice(0, 25),
      note:
        missing.length > 0
          ? "Missing files may be test uploads under apps/api/storage-test while DB is itdms_dev — see Phase 03 report"
          : undefined,
    }),
  );
  process.exit(missing.length === 0 ? 0 : 1);
} finally {
  await client.end().catch(() => undefined);
}

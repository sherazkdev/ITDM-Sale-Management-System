#!/usr/bin/env node
/**
 * Capture EXPLAIN (ANALYZE, BUFFERS) for Phase 02 hot queries on DATABASE_URL.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, "apps/api/.env");

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
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const queries = [
  {
    name: "notification_expiry_contracts",
    sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT contract_id FROM contracts
      WHERE expiry_date <= CURRENT_DATE + 30 AND expiry_date >= CURRENT_DATE`,
  },
  {
    name: "notification_unread_count",
    sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT COUNT(*) FROM notification_events WHERE read_at IS NULL`,
  },
  {
    name: "assets_by_status_group",
    sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT asset_status, COUNT(*) FROM assets GROUP BY asset_status`,
  },
  {
    name: "po_search_contains",
    sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT purchase_order_id FROM purchase_orders
      WHERE po_number ILIKE '%PO%' ORDER BY purchase_order_id DESC LIMIT 20`,
  },
  {
    name: "asset_list_search",
    sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT asset_id FROM assets
      WHERE asset_code ILIKE '%A%' OR asset_name ILIKE '%A%'
      ORDER BY asset_id DESC LIMIT 20`,
  },
  {
    name: "audit_recent",
    sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT audit_log_id FROM audit_logs ORDER BY occurred_at DESC LIMIT 20`,
  },
];

const client = new pg.Client({ connectionString: url });
const outDir = resolve(root, "docs/production");
mkdirSync(outDir, { recursive: true });
const outFile = resolve(outDir, "phase02-explain-plans.txt");

const lines = [`# EXPLAIN captured ${new Date().toISOString()}`, `DATABASE_URL host: ${url.replace(/:[^:@/]+@/, ":***@")}`, ""];

try {
  await client.connect();
  for (const q of queries) {
    lines.push(`## ${q.name}`);
    const r = await client.query(q.sql);
    lines.push(r.rows.map((row) => row["QUERY PLAN"]).join("\n"));
    lines.push("");
  }
} finally {
  await client.end().catch(() => undefined);
}

writeFileSync(outFile, lines.join("\n"));
console.log(JSON.stringify({ ok: true, file: "docs/production/phase02-explain-plans.txt" }));

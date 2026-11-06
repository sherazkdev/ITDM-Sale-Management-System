#!/usr/bin/env node
/**
 * Create isolated Playwright E2E database if missing.
 * Does not touch itdms_dev / itdms_staging / itdms_test / rehearsal DBs.
 */
import pg from "pg";

const adminUrl =
  process.env.ADMIN_DATABASE_URL ??
  process.env.DATABASE_URL?.replace(/\/[^/?]+(\?.*)?$/, "/postgres$1") ??
  "postgresql://itdms:itdms_dev_password@127.0.0.1:5433/postgres?schema=public";

const dbName = process.env.E2E_DB_NAME ?? "itdms_e2e";

if (/itdms_dev|itdms_staging/i.test(dbName)) {
  console.error(JSON.stringify({ event: "e2e_db_refused", reason: "refuses_dev_or_staging_name", dbName }));
  process.exit(1);
}

const client = new pg.Client({ connectionString: adminUrl });
await client.connect();
const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
if (exists.rowCount === 0) {
  const safe = dbName.replace(/"/g, "");
  await client.query(`CREATE DATABASE "${safe}" OWNER itdms`);
  console.log(JSON.stringify({ event: "e2e_db_created", dbName: safe }));
} else {
  console.log(JSON.stringify({ event: "e2e_db_exists", dbName }));
}
await client.end();

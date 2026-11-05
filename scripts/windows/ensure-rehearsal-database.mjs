#!/usr/bin/env node
/** Create isolated rehearsal DB if missing (Wave 6). Requires ADMIN_DATABASE_URL or DATABASE_URL to postgres db. */
import pg from "pg";

const adminUrl =
  process.env.ADMIN_DATABASE_URL ??
  process.env.DATABASE_URL?.replace(/\/[^/]+(\?.*)?$/, "/postgres$1") ??
  "postgresql://itdms:itdms_dev_password@127.0.0.1:5433/postgres?schema=public";

const dbName = process.env.REHEARSAL_DB_NAME ?? "itdms_deploy_rehearsal";

const client = new pg.Client({ connectionString: adminUrl });
await client.connect();
const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
if (exists.rowCount === 0) {
  await client.query(`CREATE DATABASE "${dbName.replace(/"/g, "")}"`);
  console.log(JSON.stringify({ event: "rehearsal_db_created", dbName }));
} else {
  console.log(JSON.stringify({ event: "rehearsal_db_exists", dbName }));
}
await client.end();

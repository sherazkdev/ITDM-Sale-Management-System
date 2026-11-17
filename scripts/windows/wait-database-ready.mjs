#!/usr/bin/env node
/**
 * Poll PostgreSQL until a simple query succeeds (not merely TCP open).
 */
import pg from "pg";

const url =
  process.env.DATABASE_URL ??
  process.env.WAIT_DATABASE_URL ??
  "postgresql://itdms:itdms_dev_password@127.0.0.1:5433/postgres?schema=public";

const timeoutMs = Number(process.env.WAIT_DB_TIMEOUT_MS ?? 120_000);
const intervalMs = Number(process.env.WAIT_DB_INTERVAL_MS ?? 1_500);
const deadline = Date.now() + timeoutMs;

while (Date.now() < deadline) {
  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    await client.query("SELECT 1 AS ok");
    await client.end();
    console.log(JSON.stringify({ event: "database_ready", databaseUrl: redact(url) }));
    process.exit(0);
  } catch (err) {
    await client.end().catch(() => undefined);
    const message = err instanceof Error ? err.message : String(err);
  if (/starting up|P1001|ECONNREFUSED|ENOTFOUND/i.test(message)) {
      await new Promise((r) => setTimeout(r, intervalMs));
      continue;
    }
    console.error(JSON.stringify({ event: "database_wait_failed", error: message }));
    process.exit(1);
  }
}

console.error(JSON.stringify({ event: "database_wait_timeout", timeoutMs }));
process.exit(1);

function redact(connectionString) {
  return connectionString.replace(/:[^:@/]+@/, ":****@");
}
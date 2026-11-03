#!/usr/bin/env node
/**
 * Verifies PostgreSQL connectivity using DATABASE_URL from environment or .env in apps/api.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, "apps/api/.env");

function loadEnvFile() {
  if (!existsSync(envPath)) {
    return;
  }
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
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
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("FAIL: DATABASE_URL is not set (copy apps/api/.env.example to apps/api/.env)");
  process.exit(1);
}

const client = new pg.Client({ connectionString: databaseUrl });

try {
  await client.connect();
  const result = await client.query("SELECT 1 AS ok");
  const ok = result.rows[0]?.ok;
  if (ok !== 1) {
    console.error("FAIL: unexpected query result", result.rows);
    process.exit(1);
  }
  console.log("OK: PostgreSQL connectivity verified (SELECT 1)");
  process.exit(0);
} catch (err) {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await client.end().catch(() => undefined);
}

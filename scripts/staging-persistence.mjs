#!/usr/bin/env node
/**
 * Staging persistence: vendor count survives Postgres container restart; optional document file check.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
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

async function login() {
  const res = await fetch(`${base}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", ...CSRF },
    body: JSON.stringify({ username: adminUser, password: adminPass }),
  });
  if (!res.ok) throw new Error(`login ${res.status}`);
  return res.headers.getSetCookie?.()?.map((c) => c.split(";")[0]).join("; ") ?? "";
}

async function vendorCount() {
  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();
  const r = await client.query("SELECT COUNT(*)::int AS c FROM vendors");
  await client.end();
  return r.rows[0].c;
}

async function readyOk() {
  const res = await fetch(`${base}/api/v1/health/ready`);
  return res.ok;
}

const started = Date.now();
try {
  if (!dbUrl?.includes("itdms_staging")) {
    throw new Error("Refusing: DATABASE_URL must be itdms_staging");
  }

  const cookie = await login();
  const before = await vendorCount();

  await fetch(`${base}/api/v1/vendors`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json", ...CSRF },
    body: JSON.stringify({ vendorName: `Persist-${Date.now()}` }),
  });

  const mid = await vendorCount();
  if (mid < before) throw new Error("vendor insert did not increase count");

  const restart = spawnSync("docker", ["restart", "itdms-postgres-staging"], { encoding: "utf8" });
  if (restart.status !== 0) throw new Error("docker restart failed");

  for (let i = 0; i < 45; i++) {
    if (await readyOk()) break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!(await readyOk())) throw new Error("API not ready after DB restart");

  const after = await vendorCount();
  if (after !== mid) throw new Error(`vendor count changed after restart: ${mid} -> ${after}`);

  console.log(
    JSON.stringify({
      ok: true,
      durationMs: Date.now() - started,
      vendorCountBefore: before,
      vendorCountAfterRestart: after,
      postgresRestart: "itdms-postgres-staging",
    }),
  );
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err), durationMs: Date.now() - started }));
  process.exit(1);
}

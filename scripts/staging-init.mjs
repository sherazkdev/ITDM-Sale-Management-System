#!/usr/bin/env node
/**
 * Initialize local staging: Postgres (compose), migrate, optional UAT seed, pre-migrate backup.
 */
import { execSync, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { existsSync, readFileSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const apiRoot = resolve(root, "apps/api");
const stagingEnvExample = resolve(apiRoot, ".env.staging.example");
const stagingEnv = resolve(apiRoot, ".env.staging");

function log(event, fields = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...fields }));
}

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

if (!existsSync(stagingEnv)) {
  if (existsSync(stagingEnvExample)) {
    copyFileSync(stagingEnvExample, stagingEnv);
    log("staging_env_created", {
      path: "apps/api/.env.staging",
      action: "Replace SESSION_SECRET before production-like runs",
    });
  } else {
    log("staging_init_failed", { reason: "Missing .env.staging.example" });
    process.exit(1);
  }
}

loadEnvFile(stagingEnv);

if (process.env.SESSION_SECRET?.includes("REPLACE_WITH")) {
  log("staging_init_failed", {
    reason: "Set SESSION_SECRET in apps/api/.env.staging (32+ chars)",
  });
  process.exit(1);
}

mkdirSync(resolve(apiRoot, "storage-staging"), { recursive: true });

const compose = spawnSync(
  "docker",
  ["compose", "-f", "docker-compose.staging.yml", "up", "-d"],
  { cwd: root, encoding: "utf8" },
);
if (compose.status !== 0) {
  log("staging_init_failed", { reason: "docker compose staging", stderr: compose.stderr?.slice(0, 500) });
  process.exit(1);
}

for (let i = 0; i < 30; i++) {
  const hc = spawnSync(
    "docker",
    ["exec", "itdms-postgres-staging", "pg_isready", "-U", "itdms_staging", "-d", "itdms_staging"],
    { encoding: "utf8" },
  );
  if (hc.status === 0) break;
  await delay(1000);
}

const backupDir = resolve(root, "backups/staging");
mkdirSync(backupDir, { recursive: true });
process.env.BACKUP_DIR = backupDir;
process.env.ITDMS_PG_CONTAINER = "itdms-postgres-staging";
try {
  execSync("node scripts/backup-itdms.mjs", {
    cwd: root,
    stdio: "pipe",
    env: process.env,
  });
  log("pre_migrate_backup", { dir: "backups/staging" });
} catch {
  log("pre_migrate_backup_skipped", { reason: "Empty or first init — no prior data" });
}

execSync("npx prisma migrate deploy", { cwd: apiRoot, stdio: "inherit", env: process.env });

if (process.env.ITDMS_STAGING_SEED_UAT === "1") {
  execSync("npx tsx prisma/seed-staging-uat.ts", { cwd: apiRoot, stdio: "inherit", env: process.env });
  log("uat_fixtures_seeded", { note: "PROPOSED accounts — see UAT checklist" });
} else {
  log("uat_seed_skipped", { hint: "Set ITDMS_STAGING_SEED_UAT=1 for fixture users" });
}

log("staging_init_complete", {
  database: "itdms_staging@127.0.0.1:5434",
  storage: process.env.STORAGE_ROOT,
});

#!/usr/bin/env node
/**
 * Verifies local backup rotation keeps N manifest generations (Wave 2/3).
 * Usage: ITDMS_BACKUP_RETAIN_LOCAL=2 node scripts/verify-backup-rotation.mjs
 */
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const testDir = resolve(repoRoot, "backups-rotation-test");
mkdirSync(testDir, { recursive: true });

process.env.BACKUP_DIR = testDir;
process.env.ITDMS_BACKUP_RETAIN_LOCAL = process.env.ITDMS_BACKUP_RETAIN_LOCAL ?? "2";

if (!process.env.DATABASE_URL) {
  console.log(
    JSON.stringify({
      event: "rotation_verify_skipped",
      reason: "DATABASE_URL not set — run against dev/staging with Postgres",
    }),
  );
  process.exit(0);
}

function manifestCount() {
  return readdirSync(testDir).filter((n) => n.startsWith("itdms-manifest-") && n.endsWith(".json"))
    .length;
}

const run1 = spawnSync("node", ["scripts/backup-itdms.mjs"], {
  cwd: repoRoot,
  stdio: "inherit",
  env: process.env,
});
if (run1.status !== 0) process.exit(run1.status ?? 1);

writeFileSync(join(testDir, ".rotation-marker"), String(Date.now()));
const afterFirst = manifestCount();

const run2 = spawnSync("node", ["scripts/backup-itdms.mjs"], {
  cwd: repoRoot,
  stdio: "inherit",
  env: process.env,
});
if (run2.status !== 0) process.exit(run2.status ?? 1);

const afterSecond = manifestCount();
const retain = Number(process.env.ITDMS_BACKUP_RETAIN_LOCAL);

console.log(
  JSON.stringify({
    event: "rotation_verify_complete",
    retainLocal: retain,
    manifestsAfterFirst: afterFirst,
    manifestsAfterSecond: afterSecond,
    ok: afterSecond <= retain && afterSecond >= Math.min(2, afterFirst + 1),
  }),
);

if (afterSecond > retain) {
  process.exit(1);
}

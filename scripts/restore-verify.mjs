#!/usr/bin/env node
/**
 * Local restore verification helper — documents steps and validates backup file presence.
 * Does NOT auto-restore production databases. Requires IT approval (D17).
 */
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

const backupFile = process.argv[2] ?? process.env.RESTORE_VERIFY_BACKUP;
if (!backupFile || !existsSync(backupFile)) {
  console.error(JSON.stringify({ ok: false, error: "Provide path to .sql backup as argv[2] or RESTORE_VERIFY_BACKUP" }));
  process.exit(1);
}

const steps = [
  "Create isolated PostgreSQL database (empty)",
  "psql or pg_restore into isolated instance",
  "cd apps/api && npx prisma migrate deploy",
  "npm run test (against isolated DATABASE_URL)",
  "Compare row counts / run smoke GET /api/v1/health/ready",
];

let prismaOk = false;
try {
  execSync("npx prisma --version", { stdio: "pipe" });
  prismaOk = true;
} catch {
  prismaOk = false;
}

console.log(
  JSON.stringify({
    ok: true,
    backupFile,
    prismaCliAvailable: prismaOk,
    manualSteps: steps,
    note: "Automated restore not executed in CI — stakeholder sign-off required (D17)",
  }),
);

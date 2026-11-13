import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { ensureTestDatabase } from "../integration/global-setup-db.js";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const prepareLockFile = path.join(os.tmpdir(), "itdms-prepare-test-db.lock");

let prepared = false;

async function ensurePostgresTestDatabase(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url || !url.includes("itdms_test")) {
    return;
  }
  const admin = new pg.Client({
    connectionString: url.replace(/\/itdms_test(\?|$)/, "/postgres$1"),
  });
  try {
    await admin.connect();
    const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = 'itdms_test'");
    if (exists.rowCount === 0) {
      await admin.query("CREATE DATABASE itdms_test OWNER itdms");
    }
  } finally {
    await admin.end().catch(() => undefined);
  }
}

async function acquirePrepareLock(): Promise<() => void> {
  const deadline = Date.now() + 180_000;
  while (true) {
    try {
      const fd = fs.openSync(prepareLockFile, "wx");
      fs.writeFileSync(fd, String(process.pid));
      return () => {
        fs.closeSync(fd);
        fs.rmSync(prepareLockFile, { force: true });
      };
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") throw err;
      try {
        const age = Date.now() - fs.statSync(prepareLockFile).mtimeMs;
        if (age > 90_000) fs.rmSync(prepareLockFile, { force: true });
      } catch {
        // The holder released the lock between the failed create and the stat.
      }
      if (Date.now() > deadline) {
        throw new Error("Timed out waiting for the test database prepare lock");
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
}

function runPrismaStep(command: string, env: NodeJS.ProcessEnv): void {
  let lastDetail = "";
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      execSync(command, {
        cwd: apiRoot,
        stdio: "pipe",
        env,
        timeout: 180_000,
      });
      return;
    } catch (err) {
      const failure = err as { stderr?: Buffer; message?: string; killed?: boolean };
      lastDetail = failure.stderr?.toString() || failure.message || String(err);
      const retryable = /advisory|lock timeout|ECONNREFUSED|starting up|P1001|P1002/i.test(lastDetail);
      if (!retryable || attempt === 2) {
        throw new Error(`${command} failed: ${lastDetail.slice(0, 700)}`);
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1_500);
    }
  }
}

export async function prepareTestDatabase(): Promise<void> {
  await ensureTestDatabase();
  await ensurePostgresTestDatabase();
  if (prepared) {
    return;
  }
  const release = await acquirePrepareLock();
  try {
    if (prepared) return;
    const seedEnv = {
      ...process.env,
      SEED_ADMIN_USERNAME: "admin.dev",
      SEED_ADMIN_PASSWORD: "ChangeMe_DevOnly!",
    };
    runPrismaStep("npx prisma migrate deploy", seedEnv);
    runPrismaStep("npx prisma db seed", seedEnv);
    prepared = true;
  } finally {
    release();
  }
}

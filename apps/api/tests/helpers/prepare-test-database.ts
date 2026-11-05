import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { ensureTestDatabase } from "../integration/global-setup-db.js";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

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

export async function prepareTestDatabase(): Promise<void> {
  await ensureTestDatabase();
  await ensurePostgresTestDatabase();
  if (prepared) {
    return;
  }
  const seedEnv = {
    ...process.env,
    SEED_ADMIN_USERNAME: "admin.dev",
    SEED_ADMIN_PASSWORD: "ChangeMe_DevOnly!",
  };
  execSync("npx prisma migrate deploy", {
    cwd: apiRoot,
    stdio: "pipe",
    env: seedEnv,
  });
  execSync("npx prisma db seed", {
    cwd: apiRoot,
    stdio: "pipe",
    env: seedEnv,
  });
  prepared = true;
}

#!/usr/bin/env node
/**
 * Auth smoke with embedded PostgreSQL (no Docker required).
 * Boots API on 3022, runs login/me/logout checks, optional Next proxy check.
 */
import { spawn, execSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import EmbeddedPostgres from "embedded-postgres";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const apiRoot = path.join(root, "apps", "api");
const PORT = "3022";
const API = `http://127.0.0.1:${PORT}`;

const embedded = new EmbeddedPostgres({
  port: 55434,
  user: "itdms",
  password: "itdms_dev_password",
  database: "itdms_auth_smoke",
  dataDir: path.join(apiRoot, "data", "auth-smoke-db"),
});

const databaseUrl =
  "postgresql://itdms:itdms_dev_password@127.0.0.1:55434/itdms_auth_smoke?schema=public";

async function login(body) {
  const res = await fetch(`${API}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  const setCookie = res.headers.getSetCookie?.() ?? [];
  return { status: res.status, json, setCookie };
}

async function me(cookie) {
  const res = await fetch(`${API}/api/v1/auth/me`, { headers: { cookie } });
  return { status: res.status, json: await res.json() };
}

function cookiesToHeader(setCookie) {
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

try {
  execSync("npm run build --workspace=@itdms/api", { cwd: root, stdio: "inherit" });

  await embedded.initialise();
  await embedded.start();
  await embedded.createDatabase("itdms_auth_smoke");

  execSync("npx prisma migrate deploy", {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
  });
  execSync("npx prisma db seed", {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
  });

  const server = spawn(process.execPath, ["dist/index.js"], {
    cwd: apiRoot,
    env: {
      ...process.env,
      NODE_ENV: "development",
      PORT,
      LOG_LEVEL: "silent",
      DATABASE_URL: databaseUrl,
      SESSION_SECRET: "auth-smoke-test-secret-min-32-chars-long",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  await delay(2500);

  const bad = await login({ username: "wrong", password: "nope" });
  if (bad.status !== 401) throw new Error(`Expected 401, got ${bad.status}`);

  const good = await login({ username: "admin.dev", password: "ChangeMe_DevOnly!" });
  if (good.status !== 200 || !good.json.success) {
    throw new Error(`Login failed: ${good.status} ${JSON.stringify(good.json)}`);
  }

  const cookie = cookiesToHeader(good.setCookie);
  if (!cookie.includes("itdms_session")) {
    throw new Error("Missing session cookie on login");
  }

  const profile = await me(cookie);
  if (profile.status !== 200 || !Array.isArray(profile.json?.data?.permissions)) {
    throw new Error(`GET /auth/me failed: ${profile.status}`);
  }

  const logout = await fetch(`${API}/api/v1/auth/logout`, {
    method: "POST",
    headers: { cookie },
  });
  if (logout.status !== 200) throw new Error(`Logout failed ${logout.status}`);

  const after = await me(cookie);
  if (after.status !== 401) throw new Error(`Expected 401 after logout, got ${after.status}`);

  console.log("OK: embedded auth smoke passed (login, me, logout, permission payload).");
  server.kill("SIGTERM");
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await embedded.stop().catch(() => undefined);
}

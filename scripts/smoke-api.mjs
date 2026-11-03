#!/usr/bin/env node
/**
 * P01 smoke check: start embedded PostgreSQL, boot API, hit health endpoints, exit.
 * Docker Compose remains the documented local dev path (port 5433).
 */
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import EmbeddedPostgres from "embedded-postgres";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const apiRoot = path.join(root, "apps", "api");

const embedded = new EmbeddedPostgres({
  port: 55433,
  user: "itdms",
  password: "itdms_dev_password",
  database: "itdms_dev",
  dataDir: path.join(apiRoot, "data", "smoke-db"),
});

const databaseUrl =
  "postgresql://itdms:itdms_dev_password@127.0.0.1:55433/itdms_dev?schema=public";

async function fetchJson(url) {
  const res = await fetch(url);
  const body = await res.json();
  return { status: res.status, body };
}

try {
  await embedded.initialise();
  await embedded.start();
  await embedded.createDatabase("itdms_dev");

  const server = spawn(process.execPath, ["dist/index.js"], {
    cwd: apiRoot,
    env: {
      ...process.env,
      NODE_ENV: "development",
      PORT: "3010",
      LOG_LEVEL: "silent",
      DATABASE_URL: databaseUrl,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let serverLog = "";
  server.stdout?.on("data", (chunk) => {
    serverLog += chunk.toString();
  });
  server.stderr?.on("data", (chunk) => {
    serverLog += chunk.toString();
  });

  await delay(2000);

  const live = await fetchJson("http://127.0.0.1:3010/api/v1/health/live");
  const ready = await fetchJson("http://127.0.0.1:3010/api/v1/health/ready");

  console.log("health/live:", live.status, JSON.stringify(live.body));
  console.log("health/ready:", ready.status, JSON.stringify(ready.body));

  if (live.status !== 200 || ready.status !== 200) {
    console.error("Smoke check failed.");
    console.error(serverLog);
    process.exitCode = 1;
  } else {
    console.log("OK: P01 smoke check passed.");
  }

  server.kill("SIGTERM");
  await delay(500);
} catch (err) {
  console.error("Smoke check error:", err);
  process.exitCode = 1;
} finally {
  await embedded.stop().catch(() => undefined);
}

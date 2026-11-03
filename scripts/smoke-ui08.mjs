#!/usr/bin/env node
/**
 * UI08 verification orchestrator — runs automated gates (requires API on :3000 for smoke scripts).
 * E2E: start API + web (`npm run dev:web` or `npm run start` in apps/web) then:
 *   npm run test:e2e --workspace=@itdms/web
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(label, cmd, args, opts = {}) {
  console.log(`\n=== ${label} ===`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opts,
  });
  if (r.status !== 0) {
    throw new Error(`${label} failed (exit ${r.status})`);
  }
}

async function main() {
  run("typecheck", "npm", ["run", "typecheck"]);
  run("lint", "npm", ["run", "lint"]);
  run("web vitest", "npm", ["run", "test", "--workspace=@itdms/web"]);
  run("web build", "npm", ["run", "build:web"]);
  run("api vitest", "npm", ["run", "test", "--workspace=@itdms/api"]);
  run("smoke web auth", "node", ["scripts/smoke-web-auth.mjs"]);
  run("smoke ui07", "node", ["scripts/smoke-ui07.mjs"]);
  console.log("\nUI08 automated gate (smoke-ui08) OK — run Playwright E2E separately when web server is up.");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});

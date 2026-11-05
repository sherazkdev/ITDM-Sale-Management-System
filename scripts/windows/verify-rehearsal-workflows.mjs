#!/usr/bin/env node
/**
 * Wave 6B — production rehearsal smoke (API + optional web reachability).
 * Env: ITDMS_API_URL (default http://127.0.0.1:3010), ITDMS_WEB_URL (3012),
 *      ITDMS_SMOKE_USER, ITDMS_SMOKE_PASSWORD
 */
const apiBase = (process.env.ITDMS_API_URL ?? "http://127.0.0.1:3010").replace(/\/$/, "");
const webBase = (process.env.ITDMS_WEB_URL ?? "http://127.0.0.1:3012").replace(/\/$/, "");
const user = process.env.ITDMS_SMOKE_USER ?? process.env.REHEARSAL_ADMIN_USER;
const password = process.env.ITDMS_SMOKE_PASSWORD ?? process.env.REHEARSAL_ADMIN_PASSWORD;

if (!user || !password) {
  console.error("Set ITDMS_SMOKE_USER and ITDMS_SMOKE_PASSWORD (or REHEARSAL_* from rehearsal script output)");
  process.exit(1);
}

let cookie = "";
let fail = 0;

async function step(name, fn) {
  try {
    await fn();
    console.log("OK", name);
  } catch (e) {
    console.error("FAIL", name, e.message ?? e);
    fail++;
  }
}

await step("health/ready", async () => {
  const r = await fetch(`${apiBase}/api/v1/health/ready`);
  const j = await r.json();
  if (!j.success || j.data?.checks?.database !== "up") throw new Error(JSON.stringify(j));
});

await step("login", async () => {
  const r = await fetch(`${apiBase}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-ITDMS-Requested-With": "ITDMS" },
    body: JSON.stringify({ username: user, password }),
  });
  if (!r.ok) throw new Error(String(r.status));
  cookie = (r.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  if (!cookie) throw new Error("no cookie");
});

const auth = () => ({ Cookie: cookie, "X-ITDMS-Requested-With": "ITDMS" });

for (const [name, path] of [
  ["dashboard summary", "/api/v1/dashboard/summary"],
  ["employees list", "/api/v1/employees?page=1&pageSize=5"],
  ["assets list", "/api/v1/assets?page=1&pageSize=5"],
  ["non-asset stock", "/api/v1/non-asset-stock-items?page=1&pageSize=5"],
  ["purchase orders", "/api/v1/purchase-orders?page=1&pageSize=5"],
  ["contracts", "/api/v1/contracts?page=1&pageSize=5"],
  ["invoices", "/api/v1/invoices?page=1&pageSize=5"],
]) {
  await step(name, async () => {
    const r = await fetch(`${apiBase}${path}`, { headers: auth() });
    if (r.status === 401 || r.status === 403) throw new Error(String(r.status));
    if (!r.ok) throw new Error(String(r.status));
  });
}

await step("reports employees xlsx", async () => {
  const r = await fetch(`${apiBase}/api/v1/reports/employees?format=xlsx`, { headers: auth() });
  if (!r.ok) throw new Error(String(r.status));
});

await step("web login page", async () => {
  const r = await fetch(`${webBase}/login`);
  if (!r.ok) throw new Error(String(r.status));
});

process.exit(fail ? 1 : 0);

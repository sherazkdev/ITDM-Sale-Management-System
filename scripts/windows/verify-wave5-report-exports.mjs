#!/usr/bin/env node
/**
 * Verifies Wave 5 report routes: auth required, XLSX/disclaimer on asset-movements.
 * Requires running API. Credentials via env (no hardcoded secrets).
 *
 *   ITDMS_API_URL=http://127.0.0.1:3000
 *   ITDMS_SMOKE_USER=admin.dev
 *   ITDMS_SMOKE_PASSWORD=...
 */
const base = (process.env.ITDMS_API_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const user = process.env.ITDMS_SMOKE_USER ?? "admin.dev";
const password = process.env.ITDMS_SMOKE_PASSWORD ?? "ChangeMe_DevOnly!";

async function main() {
  const anon = await fetch(`${base}/api/v1/reports/asset-movements?format=xlsx`);
  if (anon.status !== 401 && anon.status !== 403) {
    console.error("Expected 401/403 for anonymous asset-movements export, got", anon.status);
    process.exitCode = 1;
    return;
  }
  console.log("OK anonymous blocked:", anon.status);

  const loginRes = await fetch(`${base}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-ITDMS-Requested-With": "ITDMS" },
    body: JSON.stringify({ username: user, password }),
  });
  if (!loginRes.ok) {
    console.error("Login failed", loginRes.status, await loginRes.text());
    process.exitCode = 1;
    return;
  }
  const setCookie = loginRes.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  if (!cookie) {
    console.error("No session cookie from login");
    process.exitCode = 1;
    return;
  }

  const headers = { Cookie: cookie, "X-ITDMS-Requested-With": "ITDMS" };
  for (const path of [
    "/api/v1/reports/asset-movements?format=xlsx",
    "/api/v1/reports/employees?format=xlsx",
    "/api/v1/reports/invoices?format=json",
  ]) {
    const res = await fetch(`${base}${path}`, { headers });
    if (!res.ok) {
      console.error("FAIL", path, res.status);
      process.exitCode = 1;
      continue;
    }
    const disclaimer = res.headers.get("x-itdms-export-disclaimer");
    if (path.includes("format=xlsx")) {
      const ct = res.headers.get("content-type") ?? "";
      if (!/excel|spreadsheet/i.test(ct)) {
        console.error("FAIL content-type", path, ct);
        process.exitCode = 1;
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 100 || !buf.toString("utf8", 0, 200).includes("Workbook")) {
        console.error("FAIL XLSX structure", path);
        process.exitCode = 1;
        continue;
      }
    }
    console.log("OK", path, disclaimer ? `disclaimer=${disclaimer}` : "json");
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

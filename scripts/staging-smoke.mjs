#!/usr/bin/env node
/**
 * Staging smoke: health, auth, CSRF, document round-trip against running staging API.
 * Env from apps/api/.env.staging; API default http://127.0.0.1:3002
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const stagingEnv = resolve(root, "apps/api/.env.staging");

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

loadEnvFile(stagingEnv);

const base = (process.env.STAGING_API_BASE ?? `http://127.0.0.1:${process.env.PORT ?? 3002}`).replace(
  /\/$/,
  "",
);
const CSRF = { "x-itdms-requested-with": "itdms" };
const adminUser = process.env.STAGING_UAT_ADMIN_USER ?? "uat.admin";
const adminPass = process.env.STAGING_UAT_ADMIN_PASSWORD ?? "StagingUatAdmin-ChangeMe!";

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
}

try {
  const live = await fetch(`${base}/api/v1/health/live`);
  record("health/live", live.ok, live.status);

  const ready = await fetch(`${base}/api/v1/health/ready`);
  record("health/ready", ready.ok, ready.status);

  const login = await fetch(`${base}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", ...CSRF },
    body: JSON.stringify({ username: adminUser, password: adminPass }),
  });
  const cookies = login.headers.getSetCookie?.()?.map((c) => c.split(";")[0]).join("; ") ?? "";
  record("auth/login", login.ok && cookies.length > 0, login.status);

  const me = await fetch(`${base}/api/v1/auth/me`, { headers: { cookie: cookies, ...CSRF } });
  record("auth/me", me.ok, me.status);

  const noCsrf = await fetch(`${base}/api/v1/vendors`, {
    method: "POST",
    headers: { cookie: cookies, "content-type": "application/json" },
    body: JSON.stringify({ vendorName: `csrf-staging-${Date.now()}` }),
  });
  record("csrf/blocks_mutation_without_header", noCsrf.status === 403, noCsrf.status);

  const tinyPdf = Buffer.from("%PDF-1.4 staging smoke\n").toString("base64");
  const vendor = await fetch(`${base}/api/v1/vendors`, {
    method: "POST",
    headers: { cookie: cookies, "content-type": "application/json", ...CSRF },
    body: JSON.stringify({ vendorName: `StagingSmoke-${Date.now()}` }),
  });
  const vendorBody = await vendor.json();
  const vendorId = vendorBody?.data?.vendorId;
  record("workflow/create_vendor", vendor.ok && vendorId, vendor.status);

  if (vendorId) {
    const up = await fetch(`${base}/api/v1/documents/uploads`, {
      method: "POST",
      headers: { cookie: cookies, "content-type": "application/json", ...CSRF },
      body: JSON.stringify({
        ownerType: "purchase_order",
        ownerId: "999999",
        originalFileName: "should-fail-owner.pdf",
        mimeType: "application/pdf",
        contentBase64: tinyPdf,
      }),
    });
    record("document/rejects_invalid_owner", up.status === 404 || up.status === 422, up.status);
  }

  const allOk = results.every((r) => r.ok);
  console.log(JSON.stringify({ ok: allOk, base, results }, null, 2));
  process.exit(allOk ? 0 : 1);
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err), results }, null, 2));
  process.exit(1);
}

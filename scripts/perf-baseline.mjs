#!/usr/bin/env node
/**
 * API latency baseline — requires running API (default http://127.0.0.1:3000).
 * Respects CSRF + session cookie for authenticated reads.
 *
 * Env: API_BASE (default http://127.0.0.1:3000), ADMIN_USER, ADMIN_PASS
 */
import { performance } from "node:perf_hooks";

const base = (process.env.API_BASE ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const adminUser = process.env.ADMIN_USER ?? "admin.dev";
const adminPass = process.env.ADMIN_PASS ?? "ChangeMe_DevOnly!";

const CSRF_HEADER = "x-itdms-requested-with";
const CSRF_VALUE = "itdms";

async function login() {
  const res = await fetch(`${base}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", [CSRF_HEADER]: CSRF_VALUE },
    body: JSON.stringify({ username: adminUser, password: adminPass }),
  });
  if (!res.ok) {
    throw new Error(`login failed ${res.status}`);
  }
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  if (!cookie) {
    throw new Error("no session cookie");
  }
  return cookie;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

async function measure(name, cookie, path, iterations = 30) {
  const times = [];
  let errors = 0;
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    const res = await fetch(`${base}${path}`, {
      headers: { cookie, [CSRF_HEADER]: CSRF_VALUE },
    });
    const ms = performance.now() - t0;
    times.push(ms);
    if (!res.ok) errors++;
  }
  times.sort((a, b) => a - b);
  return {
    endpoint: path,
    iterations,
    errors,
    avgMs: Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 100) / 100,
    p50Ms: Math.round(percentile(times, 50) * 100) / 100,
    p95Ms: Math.round(percentile(times, 95) * 100) / 100,
    p99Ms: Math.round(percentile(times, 99) * 100) / 100,
  };
}

async function mixedWorkload(cookie, seconds = 15, concurrency = 5) {
  const paths = [
    "/api/v1/dashboard/summary",
    "/api/v1/assets?page=1&pageSize=20",
    "/api/v1/purchase-orders?page=1&pageSize=20",
    "/api/v1/invoices?page=1&pageSize=20",
    "/api/v1/notifications?page=1&pageSize=20",
    "/api/v1/health/ready",
  ];
  const end = Date.now() + seconds * 1000;
  let total = 0;
  let errors = 0;
  const times = [];

  async function worker() {
    while (Date.now() < end) {
      const path = paths[Math.floor(Math.random() * paths.length)];
      const t0 = performance.now();
      try {
        const res = await fetch(`${base}${path}`, {
          headers: { cookie, [CSRF_HEADER]: CSRF_VALUE },
        });
        if (!res.ok) errors++;
      } catch {
        errors++;
      }
      times.push(performance.now() - t0);
      total++;
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  times.sort((a, b) => a - b);
  return {
    mode: "mixed_read",
    durationSec: seconds,
    concurrency,
    requests: total,
    errors,
    rps: Math.round((total / seconds) * 100) / 100,
    p50Ms: Math.round(percentile(times, 50) * 100) / 100,
    p95Ms: Math.round(percentile(times, 95) * 100) / 100,
  };
}

const started = Date.now();
let cookie;
try {
  cookie = await login();
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err), hint: "Start API with dev:api and seeded admin" }));
  process.exit(1);
}

const endpoints = [
  "/api/v1/health/ready",
  "/api/v1/dashboard/summary",
  "/api/v1/assets?page=1&pageSize=20",
  "/api/v1/purchase-orders?page=1&pageSize=20",
  "/api/v1/invoices?page=1&pageSize=20",
  "/api/v1/notifications/unread-count",
];

const individual = [];
for (const path of endpoints) {
  individual.push(await measure(path, cookie, path, 25));
}

const mixed = await mixedWorkload(cookie, 12, 4);

console.log(
  JSON.stringify({
    ok: true,
    environment: {
      apiBase: base,
      note: "Local dev dataset — not production capacity",
      durationMs: Date.now() - started,
    },
    individual,
    mixed,
  }),
);

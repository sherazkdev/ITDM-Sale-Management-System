#!/usr/bin/env node
/**
 * Poll an HTTP URL until status is in an allowed set (default 2xx).
 */
const targetUrl = process.env.WAIT_HTTP_URL;
if (!targetUrl) {
  console.error(JSON.stringify({ event: "wait_http_missing_url" }));
  process.exit(1);
}

const timeoutMs = Number(process.env.WAIT_HTTP_TIMEOUT_MS ?? 180_000);
const intervalMs = Number(process.env.WAIT_HTTP_INTERVAL_MS ?? 1_500);
const expectStatuses = (process.env.WAIT_HTTP_STATUSES ?? "200")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => !Number.isNaN(n));

const deadline = Date.now() + timeoutMs;

while (Date.now() < deadline) {
  try {
    const res = await fetch(targetUrl, { redirect: "follow" });
    if (expectStatuses.includes(res.status)) {
      console.log(JSON.stringify({ event: "http_ready", url: targetUrl, status: res.status }));
      process.exit(0);
    }
  } catch {
    // connection errors — retry
  }
  await new Promise((r) => setTimeout(r, intervalMs));
}

console.error(JSON.stringify({ event: "http_wait_timeout", url: targetUrl, timeoutMs }));
process.exit(1);
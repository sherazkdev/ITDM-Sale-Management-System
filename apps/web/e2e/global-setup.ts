import type { FullConfig } from "@playwright/test";

const defaultApi = process.env.ITDMS_API_URL ?? "http://127.0.0.1:3020";
const webOrigin = process.env.WEB_ORIGIN ?? "http://127.0.0.1:3021";

async function waitForHttp(url: string, timeoutMs: number, okStatuses: number[]) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "";
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (okStatuses.includes(res.status)) return;
      lastError = `status ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    await new Promise((r) => setTimeout(r, 1_500));
  }
  throw new Error(`Timed out waiting for ${url} (${lastError})`);
}

export default async function globalSetup(_config: FullConfig) {
  const skip = process.env.ITDMS_E2E_SKIP_READINESS === "1";
  if (skip) return;

  await waitForHttp(`${defaultApi}/api/v1/health/ready`, 180_000, [200]);
  await waitForHttp(`${webOrigin}/login`, 180_000, [200]);

  const user = process.env.ITDMS_E2E_USER ?? "admin.dev";
  const password = process.env.ITDMS_E2E_PASSWORD ?? "ChangeMe_DevOnly!";
  const login = await fetch(`${defaultApi}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-itdms-requested-with": "itdms" },
    body: JSON.stringify({ username: user, password }),
  });
  if (login.status !== 200) {
    throw new Error(`E2E API warm login failed with HTTP ${login.status}`);
  }
}
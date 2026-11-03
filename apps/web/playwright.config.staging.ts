import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

/** Staging 04B — targets local stack API :3002, web :3011, UAT accounts via env. */
const webOrigin = process.env.WEB_ORIGIN ?? "http://127.0.0.1:3011";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /staging-verification\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  reporter: [["list"]],
  use: {
    baseURL: webOrigin,
    trace: "on-first-retry",
    screenshot: "on",
  },
  webServer: process.env.STAGING_E2E_SKIP_WEBSERVER
    ? undefined
    : {
        command: "npm run start",
        cwd: path.join(__dirname),
        url: webOrigin,
        reuseExistingServer: true,
        timeout: 180_000,
        env: {
          ...process.env,
          ITDMS_API_URL: process.env.ITDMS_API_URL ?? "http://127.0.0.1:3002",
          ITDMS_SESSION_COOKIE_NAME: process.env.ITDMS_SESSION_COOKIE_NAME ?? "itdms_session",
        },
      },
  projects: [
    {
      name: "staging-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
});

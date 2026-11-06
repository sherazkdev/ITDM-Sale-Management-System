import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

/**
 * Local regression Playwright config.
 *
 * Write-capable tests must target an isolated API database (`itdms_e2e`).
 * Staging UAT flows live in `playwright.config.staging.ts` / `staging-verification.spec.ts`
 * and are excluded here until authorized staging accounts are provided.
 *
 * Prepare DB: `.\scripts\windows\prepare-e2e-database.ps1`
 * Then point API `DATABASE_URL` at `itdms_e2e` before running tests.
 */
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3011";
const authFile = path.join(__dirname, "e2e", ".auth", "admin.json");

/** Staging-only; run via `npm run staging:e2e` when UAT credentials exist. */
const stagingOnly = /staging-verification\.spec\.ts/;

export default defineConfig({
  testDir: "./e2e",
  testIgnore: [stagingOnly],
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: webOrigin,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  webServer: {
    command: "npm run start",
    cwd: path.join(__dirname),
    url: webOrigin,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium-desktop",
      testIgnore: [/auth\.setup\.ts/, stagingOnly],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        storageState: authFile,
      },
      dependencies: ["setup"],
    },
  ],
});

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
const webOrigin = process.env.WEB_ORIGIN ?? "http://127.0.0.1:3021";
const useExternalStack = process.env.ITDMS_E2E_EXTERNAL_STACK === "1";
const authFile = path.join(__dirname, "e2e", ".auth", "admin.json");

function resolveWebListenPort(origin: string): string {
  try {
    const { port, protocol } = new URL(origin);
    if (port) return port;
    return protocol === "https:" ? "443" : "80";
  } catch {
    return "3021";
  }
}

const webListenPort = resolveWebListenPort(webOrigin);

/** Staging-only; run via `npm run staging:e2e` when UAT credentials exist. */
const stagingOnly = /staging-verification\.spec\.ts/;
/** Screenshot/marketing captures — run via `npm run test:e2e:visual-capture` (not UAT gate). */
const visualCaptureOnly = /-(capture)\.spec\.ts|screenshots\.spec\.ts/;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: path.join(__dirname, "e2e", "global-setup.ts"),
  testIgnore: [stagingOnly, visualCaptureOnly],
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
  ...(useExternalStack
    ? {}
    : {
        webServer: {
          command: `next start -p ${webListenPort}`,
          cwd: path.join(__dirname),
          url: webOrigin,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
          env: {
            ...process.env,
            ITDMS_API_URL: process.env.ITDMS_API_URL ?? "http://127.0.0.1:3020",
          },
        },
      }),
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium-desktop",
      testIgnore: [/auth\.setup\.ts/, stagingOnly, visualCaptureOnly],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        storageState: authFile,
      },
      dependencies: ["setup"],
    },
  ],
});

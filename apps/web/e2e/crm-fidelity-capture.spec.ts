import { test } from "@playwright/test";
import path from "node:path";
import { applyTheme } from "./helpers-visual";

const OUT = path.resolve(__dirname, "../../../docs/frontend/screenshots/crm-fidelity");

const ROUTES = [
  { name: "login", path: "/login", auth: false },
  { name: "dashboard", path: "/dashboard", auth: true },
  { name: "employees", path: "/employees", auth: true },
  { name: "purchase-orders", path: "/purchase-orders", auth: true },
] as const;

test.describe("CRM fidelity capture", () => {
  test.describe.configure({ timeout: 120_000 });

  for (const theme of ["light", "dark"] as const) {
    test(`login ${theme} @ 1440`, async ({ page }) => {
      await page.context().clearCookies();
      await page.setViewportSize({ width: 1440, height: 900 });
      await applyTheme(page, theme);
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(OUT, `itdms-login-1440-${theme}.png`),
        fullPage: true,
      });
    });

    test(`app shell ${theme} @ 1440`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await applyTheme(page, theme);
      for (const route of ROUTES.filter((r) => r.auth)) {
        await page.goto(route.path, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(OUT, `itdms-${route.name}-1440-${theme}.png`),
          fullPage: true,
        });
      }
    });
  }
});

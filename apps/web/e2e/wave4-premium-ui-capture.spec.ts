import { test, expect } from "@playwright/test";
import path from "node:path";
import { applyTheme } from "./helpers-visual";

const OUT = path.resolve(__dirname, "../../../docs/frontend/screenshots/wave4-premium-ui");

const PRIORITY_ROUTES = [
  { name: "dashboard", path: "/dashboard" },
  { name: "employees", path: "/employees" },
  { name: "asset-issuance", path: "/asset-issuance" },
] as const;

const REPRESENTATIVE_ROUTES = [
  { name: "vendors", path: "/vendors" },
  { name: "assets", path: "/assets" },
  { name: "purchase-orders", path: "/purchase-orders" },
  { name: "invoices", path: "/invoices" },
  { name: "budgets", path: "/budgets" },
  { name: "login", path: "/login", public: true },
] as const;

const VIEWPORTS = [
  { tag: "1440", width: 1440, height: 900 },
  { tag: "390", width: 390, height: 844 },
] as const;

test.describe("Wave 4 premium UI capture", () => {
  test.describe.configure({ timeout: 300_000 });

  for (const theme of ["light", "dark"] as const) {
    test(`priority pages — ${theme}`, async ({ page }) => {
      await applyTheme(page, theme);
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        for (const route of PRIORITY_ROUTES) {
          await page.goto(route.path, { waitUntil: "networkidle" });
          await expect(page.locator("main").first()).toBeVisible({ timeout: 20_000 });
          await page.screenshot({
            path: path.join(OUT, `${route.name}-${vp.tag}-${theme}.png`),
            fullPage: true,
          });
        }
      }
    });
  }

  test("representative routes — light @ 1440", async ({ page }) => {
    await applyTheme(page, "light");
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const route of REPRESENTATIVE_ROUTES.filter((r) => !("public" in r && r.public))) {
      await page.goto(route.path, { waitUntil: "networkidle" });
      await expect(page.locator("main").first()).toBeVisible({ timeout: 20_000 });
      await page.screenshot({
        path: path.join(OUT, `${route.name}-1440-light.png`),
        fullPage: true,
      });
    }
  });

  test.describe("login", () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test("login — 1440 light + dark", async ({ page }) => {
      for (const theme of ["light", "dark"] as const) {
        await applyTheme(page, theme);
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto("/login", { waitUntil: "networkidle" });
        await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
        await page.screenshot({
          path: path.join(OUT, `login-1440-${theme}.png`),
          fullPage: true,
        });
      }
    });
  });
});

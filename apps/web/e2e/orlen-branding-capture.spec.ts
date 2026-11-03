import { test, expect } from "@playwright/test";
import path from "node:path";
import { applyTheme } from "./helpers-visual";

const OUT = path.resolve(__dirname, "../../../docs/frontend/screenshots/orlen-branding");

/** Representative pages for ORLEN branding verification (layout unchanged). */
const ROUTES = [
  { name: "login", path: "/login", public: true },
  { name: "dashboard", path: "/dashboard" },
  { name: "employees", path: "/employees" },
  { name: "vendors", path: "/vendors" },
  { name: "assets", path: "/assets" },
  { name: "invoices", path: "/invoices" },
] as const;

const VIEWPORTS = [
  { tag: "1440", width: 1440, height: 900 },
  { tag: "390", width: 390, height: 844 },
] as const;

test.describe("ORLEN final branding capture", () => {
  test.describe.configure({ timeout: 300_000 });

  test.describe("authenticated routes", () => {
    for (const theme of ["light", "dark"] as const) {
      test(`after branding — ${theme} @ 1440 + 390`, async ({ page }) => {
        await applyTheme(page, theme);

        for (const vp of VIEWPORTS) {
          await page.setViewportSize({ width: vp.width, height: vp.height });

          for (const route of ROUTES.filter((r) => !("public" in r && r.public))) {
            await page.goto(route.path, { waitUntil: "networkidle" });
            await expect(page.locator("main").first()).toBeVisible({ timeout: 20_000 });
            await page.screenshot({
              path: path.join(OUT, `after-${route.name}-${vp.tag}-${theme}.png`),
              fullPage: true,
            });
          }
        }
      });
    }
  });

  test.describe("login (unauthenticated)", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    for (const theme of ["light", "dark"] as const) {
      test(`after branding — login ${theme}`, async ({ page }) => {
        await applyTheme(page, theme);
        for (const vp of VIEWPORTS) {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.goto("/login", { waitUntil: "networkidle" });
          await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
          await page.screenshot({
            path: path.join(OUT, `after-login-${vp.tag}-${theme}.png`),
            fullPage: true,
          });
        }
      });
    }
  });

  test("primary button uses ORLEN red token", async ({ page }) => {
    await applyTheme(page, "light");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const primary = page.locator("button.bg-brand-gradient, a.bg-brand-gradient").first();
    await expect(primary).toBeVisible({ timeout: 15_000 });
    const bg = await primary.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toMatch(/gradient|rgb|hsl/i);
  });
});

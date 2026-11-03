import { test, expect } from "@playwright/test";
import path from "node:path";
import { applyTheme, assertNoHorizontalPageOverflow, VIEWPORTS } from "./helpers-visual";

const OUT = path.resolve(__dirname, "../../../docs/frontend/screenshots/wave4b-premium-ui");

const PRIORITY = [
  { name: "dashboard", path: "/dashboard" },
  { name: "employees", path: "/employees" },
  { name: "asset-issuance", path: "/asset-issuance" },
] as const;

const CAPTURE_VIEWPORTS = [
  { tag: "1440", width: 1440, height: 900 },
  { tag: "390", width: 390, height: 844 },
] as const;

test.describe("Wave 4B fidelity capture", () => {
  test.describe.configure({ timeout: 300_000 });

  for (const theme of ["light", "dark"] as const) {
    test(`priority — ${theme}`, async ({ page }) => {
      await applyTheme(page, theme);
      for (const vp of CAPTURE_VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        for (const route of PRIORITY) {
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

  test("responsive overflow — priority routes", async ({ page }) => {
    await applyTheme(page, "light");
    const checkWidths = VIEWPORTS.filter((v) =>
      ["1366", "1280", "1024", "768", "375"].includes(v.label),
    );
    for (const vp of checkWidths) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const route of PRIORITY) {
        await page.goto(route.path, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(300);
        const overflow = await assertNoHorizontalPageOverflow(page);
        expect(overflow, `${route.path} @ ${vp.label}px`).toBe(false);
      }
    }
  });
});

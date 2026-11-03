import { test } from "@playwright/test";
import path from "node:path";
import { VISUAL_ROUTES, VIEWPORTS, applyTheme, type ThemeMode } from "./helpers-visual";

const OUT_DIR = path.resolve(__dirname, "../../../docs/frontend/screenshots/ui08");

const captureEnabled = process.env.CAPTURE_UI08_SCREENSHOTS === "1";

(captureEnabled ? test.describe : test.describe.skip)("UI08 visual capture matrix", () => {
  test.describe.configure({ timeout: 600_000 });

  for (const theme of ["light", "dark"] as ThemeMode[]) {
    for (const vp of VIEWPORTS) {
      for (const route of VISUAL_ROUTES) {
        test(`${route} ${vp.label}px ${theme}`, async ({ page }) => {
          await applyTheme(page, theme);
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.goto(route, { waitUntil: "domcontentloaded" });
          await page.waitForTimeout(400);
          const slug = route.replace(/^\//, "").replace(/\//g, "-") || "root";
          const file = path.join(OUT_DIR, `${slug}-${vp.label}-${theme}.png`);
          await page.screenshot({ path: file, fullPage: true });
        });
      }
    }
  }
});

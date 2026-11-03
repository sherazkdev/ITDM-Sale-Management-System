import { test, expect } from "@playwright/test";
import { STATIC_APP_ROUTES } from "./helpers";
import { VIEWPORTS, assertNoHorizontalPageOverflow } from "./helpers-visual";

test.describe("Responsive layout (no horizontal page overflow)", () => {
  for (const vp of VIEWPORTS) {
    for (const route of STATIC_APP_ROUTES) {
      test(`${route} @ ${vp.label}px`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const response = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 60_000 });
        expect(response?.status()).toBeLessThan(500);
        await page.waitForTimeout(300);
        const overflow = await assertNoHorizontalPageOverflow(page);
        expect(overflow, `Horizontal overflow on ${route} at ${vp.label}px`).toBe(false);
      });
    }
  }
});

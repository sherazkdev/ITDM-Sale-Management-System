import { test, expect } from "@playwright/test";
import { STATIC_APP_ROUTES } from "./helpers";

test.describe("Route smoke (authenticated admin)", () => {
  for (const route of STATIC_APP_ROUTES) {
    test(`loads ${route}`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 60_000 });
      expect(response?.status(), `HTTP status for ${route}`).toBeLessThan(500);
      await expect(page.getByRole("heading", { name: /access denied/i })).toHaveCount(0);
      await expect(page.locator("body")).not.toContainText("ModulePlaceholder");
    });
  }
});

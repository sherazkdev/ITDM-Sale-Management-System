import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { applyTheme, DARK_MODE_ROUTES } from "./helpers-visual";

test.describe("Dark mode shell", () => {
  for (const route of DARK_MODE_ROUTES) {
    test(`${route} renders in dark theme`, async ({ page }) => {
      await applyTheme(page, "dark");
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("html")).toHaveClass(/dark/);
      await expect(page.getByRole("heading").first()).toBeVisible();
    });
  }
});

test.describe("Dark mode accessibility (axe sample)", () => {
  const sample = ["/dashboard", "/purchase-orders", "/invoices"] as const;

  for (const route of sample) {
    test(`axe ${route} (dark, serious/critical)`, async ({ page }) => {
      await applyTheme(page, "dark");
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .disableRules(["color-contrast"])
        .analyze();
      const blocking = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );
      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    });
  }
});

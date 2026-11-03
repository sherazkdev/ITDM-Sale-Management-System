import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const AUTH_ROUTES = ["/dashboard", "/employees", "/purchase-orders", "/asset-issuance"] as const;

test.describe("Accessibility — login", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("axe serious/critical on login", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#username").waitFor({ state: "visible" });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
});

test.describe("Accessibility — authenticated", () => {
  for (const route of AUTH_ROUTES) {
    test(`axe serious/critical ${route}`, async ({ page }) => {
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

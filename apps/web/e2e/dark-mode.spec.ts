import { test, expect, type Page } from "@playwright/test";
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

async function analyzeWithin(page: Page, budgetMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`axe analyze exceeded ${budgetMs}ms`));
    }, budgetMs);
  });
  try {
    return await Promise.race([
      new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .disableRules(["color-contrast"])
        .analyze(),
      timeout,
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

test.describe("Dark mode accessibility (axe sample)", () => {
  const sample = ["/dashboard", "/purchase-orders", "/invoices"] as const;

  for (const route of sample) {
    test(`axe ${route} (dark, serious/critical)`, async ({ page }) => {
      // A previous run stayed in axe for ~42 minutes while the page never went quiet
      // (stale chunk reload). Keep the same serious/critical coverage, but fail closed.
      test.setTimeout(90_000);
      await applyTheme(page, "dark");
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.getByText(/application error|client-side exception/i)).toHaveCount(0);
      await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 20_000 });
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
      const results = await analyzeWithin(page, 45_000);
      const blocking = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );
      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    });
  }
});

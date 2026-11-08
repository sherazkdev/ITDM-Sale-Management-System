import { test, expect } from "@playwright/test";

test.describe("List tables — URL + server sort", () => {
  test("vendors sort updates query string", async ({ page }) => {
    await page.goto("/vendors");
    await page.getByRole("button", { name: /Sort by Vendor/i }).click();
    await expect(page).toHaveURL(/sortBy=vendorName/);
  });

  test("invoices search persists in URL", async ({ page }) => {
    await page.goto("/invoices");
    await page.getByPlaceholder(/search invoice # or po number/i).fill("INV");
    await page.waitForURL(/search=INV/, { timeout: 10_000 });
  });
});

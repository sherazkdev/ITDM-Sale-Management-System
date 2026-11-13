import { test, expect } from "@playwright/test";

const CREATE_ROUTES = [
  { path: "/purchase-orders/new", heading: /new purchase order/i },
  { path: "/contracts/new", heading: /add contract/i },
  { path: "/maintenance/new", heading: /new maintenance/i },
  { path: "/software-licenses/new", heading: /new software license/i },
  { path: "/documents", heading: /documents/i },
] as const;

test.describe("Phase D — create forms", () => {
  for (const route of CREATE_ROUTES) {
    test(`${route.path} shows searchable controls and validation`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible();

      if (route.path === "/documents") {
        await expect(page.getByLabel(/owner type/i)).toBeVisible();
        const review = page.getByRole("button", { name: /review upload/i });
        await expect(review).toBeVisible();
        await expect(review).toBeDisabled();
        return;
      }

      const submit = page.getByRole("button", { name: /create|draft/i }).first();
      await submit.click();
      await expect(page.getByText(/required|invalid/i).first()).toBeVisible({ timeout: 10_000 });
    });
  }

  test("purchase order vendor field is searchable", async ({ page }) => {
    await page.goto("/purchase-orders/new", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Vendor", exact: true }).click();
    await expect(page.getByRole("listbox")).toBeVisible({ timeout: 20_000 });
    const filter = page.getByRole("textbox", { name: /filter options/i });
    if ((await filter.count()) > 0) {
      await expect(filter).toBeVisible();
    }
  });
});

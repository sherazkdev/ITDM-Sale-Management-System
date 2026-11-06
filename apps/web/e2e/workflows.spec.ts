import { test, expect } from "@playwright/test";

test.describe("Employee lifecycle (UI)", () => {
  test("create employee and see in list", async ({ page }) => {
    const code = `E2E-${Date.now()}`;
    await page.goto("/employees/new");
    await page.getByLabel(/employee number/i).fill(code);
    await page.getByLabel(/full name/i).fill("E2E QA Employee");
    await page.getByLabel(/department/i).fill("IT");
    await page.getByLabel(/designation/i).fill("QA Tester");
    await page.getByRole("button", { name: /create employee/i }).click();
    await expect(page).toHaveURL(/\/employees\//, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /E2E QA Employee/i }).first()).toBeVisible();
  });
});

test.describe("PO search", () => {
  test("shows empty guidance before search", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByRole("heading", { name: /po search/i })).toBeVisible();
    await expect(page.getByText(/enter a po number/i)).toBeVisible();
  });

  test("Ctrl+K opens PO search from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await page.locator("main").click({ position: { x: 8, y: 8 } });
    await page.keyboard.press("Control+k");
    await expect(page).toHaveURL(/\/search/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /po search/i })).toBeVisible();
  });
});

test.describe("Phase A invoice filters", () => {
  test("invoice list exposes search and payment status filter", async ({ page }) => {
    await page.goto("/invoices");
    await expect(page.getByRole("heading", { name: /invoices & payments/i })).toBeVisible();
    await expect(page.getByPlaceholder(/search invoice # or po number/i)).toBeVisible();
    await expect(page.getByLabel(/filter by payment status/i)).toBeVisible();
  });
});

test.describe("Phase A help", () => {
  test("help control opens help page", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: /^help$/i }).click();
    await expect(page).toHaveURL(/\/help/);
    await expect(page.getByRole("heading", { name: /^help$/i })).toBeVisible();
  });
});

test.describe("Reports provisional disclaimer", () => {
  test("shows D12 notice on reports page", async ({ page }) => {
    await page.goto("/reports");
    await expect(page.getByText(/provisional export/i)).toBeVisible();
    await expect(page.getByText(/NON-OFFICIAL-D12/)).toBeVisible();
  });
});

import { test, expect, type Page } from "@playwright/test";

export const ADMIN = {
  username: process.env.ITDMS_E2E_USER ?? "admin.dev",
  password: process.env.ITDMS_E2E_PASSWORD ?? "ChangeMe_DevOnly!",
};

export async function loginAsAdmin(page: Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.locator("#username").waitFor({ state: "visible", timeout: 30_000 });
  await page.locator("#username").fill(ADMIN.username);
  await page.locator("#password").fill(ADMIN.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
}

/** Authenticated app routes (excluding dynamic segments). */
export const STATIC_APP_ROUTES = [
  "/dashboard",
  "/employees",
  "/employees/new",
  "/vendors",
  "/vendors/new",
  "/asset-categories",
  "/assets",
  "/assets/new",
  "/asset-history",
  "/contracts",
  "/contracts/new",
  "/purchase-orders",
  "/purchase-orders/new",
  "/asset-issuance",
  "/invoices",
  "/invoices/new",
  "/budgets",
  "/maintenance",
  "/maintenance/new",
  "/software-licenses",
  "/software-licenses/new",
  "/search",
  "/documents",
  "/reports",
  "/notifications",
  "/admin",
  "/admin/audit",
] as const;

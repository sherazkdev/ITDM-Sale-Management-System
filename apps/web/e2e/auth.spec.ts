import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Authentication", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("rejects invalid credentials", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.locator("#username").fill("not-a-real-user");
    await page.locator("#password").fill("wrong-password-xyz");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/invalid username or password/i)).toBeVisible({ timeout: 15_000 });
  });

  test("login persists session after reload", async ({ page }) => {
    await loginAsAdmin(page);
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
    // Greeting is time-of-day dependent (morning / afternoon / evening).
    await expect(page.getByRole("heading", { name: /good (morning|afternoon|evening)/i })).toBeVisible();
  });

  test("anonymous user is redirected from protected route", async ({ page }) => {
    await page.goto("/employees");
    await expect(page).toHaveURL(/\/login/);
  });
});

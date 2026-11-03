import { test, expect } from "@playwright/test";
import { STATIC_APP_ROUTES } from "./helpers";

const STAGING_ADMIN = {
  username: process.env.ITDMS_E2E_USER ?? "uat.admin",
  password: process.env.ITDMS_E2E_PASSWORD ?? "StagingUatAdmin-ChangeMe!",
};

const STAGING_READER = {
  username: process.env.ITDMS_E2E_READER ?? "uat.reader",
  password: process.env.ITDMS_E2E_READER_PASSWORD ?? "StagingUatReader-ChangeMe!",
};

async function login(page: import("@playwright/test").Page, creds: { username: string; password: string }) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.locator("#username").fill(creds.username);
  await page.locator("#password").fill(creds.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
}

test.describe("Staging integration (04B)", () => {
  test("admin login, module navigation, session reload, logout", async ({ page }) => {
    await login(page, STAGING_ADMIN);

    for (const route of STATIC_APP_ROUTES) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
      await expect(page.locator("body")).toBeVisible();
    }

    await page.goto("/dashboard");
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);

    const menuTrigger = page.getByRole("button").filter({ hasText: /uat\.admin|UAT Admin/i }).first();
    await menuTrigger.click({ timeout: 15_000 });
    await page.getByRole("menuitem", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
  });

  test("read-only UAT user denied on employee create route and API", async ({ page }) => {
    await login(page, STAGING_READER);
    await page.goto("/employees/new");
    await expect(page.getByRole("heading", { name: /access denied/i })).toBeVisible();
    const res = await page.request.post("/api/v1/employees", {
      headers: { "x-itdms-requested-with": "itdms" },
      data: { employeeNumber: `RO-${Date.now()}`, fullName: "Should Fail" },
    });
    expect(res.status()).toBe(403);
  });
});

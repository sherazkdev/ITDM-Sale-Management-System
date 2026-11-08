import { test, expect } from "@playwright/test";
import path from "node:path";
import { apiPostEnvelope } from "./helpers/api";

test.describe.configure({ mode: "serial" });

test.describe("D09 — non-asset inventory workflow (UI + API)", () => {
  const ts = Date.now();
  let categoryId = "";
  let stockItemId = "";
  let employeeId = "";
  let employeeNumber = "";
  const stockCode = `D09-E2E-${ts}`;

  test("fixture: category, employee, 100 ft stock", async ({ page }) => {
    const cat = await apiPostEnvelope<{ categoryId: string }>(page, "/asset-categories", {
      categoryName: `D09-CAT-${ts}`,
    });
    expect(cat.status).toBe(201);
    categoryId = cat.json.data.categoryId;

    employeeNumber = `D09-E-${ts}`;
    const emp = await apiPostEnvelope<{ employeeId: string }>(page, "/employees", {
      employeeNumber,
      fullName: "D09 E2E Tech",
      department: "Network Ops",
    });
    expect(emp.status).toBe(201);
    employeeId = emp.json.data.employeeId;

    const stock = await apiPostEnvelope<{ stockItemId: string; quantityAvailable: number }>(
      page,
      "/non-asset-stock-items",
      {
        stockCode,
        itemName: "D09 E2E cable",
        categoryId,
        quantityOnHand: 100,
        unitOfMeasure: "FEET",
      },
    );
    expect(stock.status).toBe(201);
    expect(Number(stock.json.data.quantityAvailable)).toBe(100);
    stockItemId = stock.json.data.stockItemId;
  });

  async function expectAvailable(page: import("@playwright/test").Page, qty: number) {
    await page.goto(`/assets/non-asset/${stockItemId}`, { waitUntil: "networkidle" });
    const qtyLabel = String(qty).replace(".", "\\.");
    const quantities = page.locator("dl").filter({ has: page.getByText("Available", { exact: true }) });
    await expect(quantities).toContainText(new RegExp(`${qtyLabel}\\s*FEET`, "i"));
  }

  async function runMovement(
    page: import("@playwright/test").Page,
    action: "issue" | "return" | "replenish" | "writeOff",
    qty: string,
    withEmployee = false,
  ) {
    await page.goto(`/assets/non-asset/${stockItemId}`, { waitUntil: "networkidle" });
    const label =
      action === "issue"
        ? "Issue stock"
        : action === "return"
          ? "Return stock"
          : action === "replenish"
            ? "Add stock"
            : "Write off";
    await page.getByRole("button", { name: new RegExp(`^${label}$`, "i") }).click();
    await page.locator("#qty").fill(qty);
    if (withEmployee) {
      await page.getByRole("button", { name: "Employee" }).click();
      await page.getByRole("textbox", { name: "Filter options" }).fill(employeeNumber);
      await page.getByRole("option", { name: new RegExp(employeeNumber) }).click();
    }
    await page.getByRole("button", { name: new RegExp(`Review ${label}`, "i") }).click();
    await page.getByRole("button", { name: /^confirm$/i }).click();
    await expect(page.getByText(/stock updated/i)).toBeVisible({ timeout: 15_000 });
  }

  test("issue 20 → available 80", async ({ page }) => {
    test.skip(!stockItemId, "fixture missing");
    await runMovement(page, "issue", "20", true);
    await expectAvailable(page, 80);
  });

  test("return 5 → available 85", async ({ page }) => {
    test.skip(!stockItemId, "fixture missing");
    await runMovement(page, "return", "5", true);
    await expectAvailable(page, 85);
  });

  test("write off 10 → available 75", async ({ page }) => {
    test.skip(!stockItemId, "fixture missing");
    await runMovement(page, "writeOff", "10");
    await expectAvailable(page, 75);
  });

  test("replenish 2.5 → available 77.5", async ({ page }) => {
    test.skip(!stockItemId, "fixture missing");
    await runMovement(page, "replenish", "2.5");
    await expectAvailable(page, 77.5);
  });

  test("movement history shows issue/return/write-off", async ({ page }) => {
    test.skip(!stockItemId, "fixture missing");
    await page.goto(`/assets/non-asset/${stockItemId}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /movement history/i })).toBeVisible();
    await expect(page.getByText(/issue/i).first()).toBeVisible();
    await expect(page.getByText(/return/i).first()).toBeVisible();
    await expect(page.getByText(/write off/i).first()).toBeVisible();
    await expect(page.getByText(/D09 E2E Tech/i).first()).toBeVisible();
  });

  test("rejects insufficient stock via API", async ({ page }) => {
    test.skip(!stockItemId, "fixture missing");
    const bad = await apiPostEnvelope(page, `/non-asset-stock-items/${stockItemId}/movements/issue`, {
      quantity: 500,
      department: "IT",
    });
    expect(bad.status).toBe(422);
  });

  test("rejects excessive return via API", async ({ page }) => {
    test.skip(!stockItemId || !employeeId, "fixture missing");
    const bad = await apiPostEnvelope(page, `/non-asset-stock-items/${stockItemId}/movements/return`, {
      quantity: 50,
      employeeId,
    });
    expect(bad.status).toBe(422);
  });

  test("non-asset stock ledger report returns CSV with stock code", async ({ page }) => {
    test.skip(!stockCode, "fixture missing");
    const res = await page.request.get("/api/v1/reports/non-asset-stock-ledger?format=csv");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain(stockCode);
    expect(text.toLowerCase()).toContain("issue");
  });

  test("detail actions survive refresh", async ({ page }) => {
    test.skip(!stockItemId, "fixture missing");
    await page.goto(`/assets/non-asset/${stockItemId}`, { waitUntil: "networkidle" });
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: /issue stock/i })).toBeVisible();
    await expect(page.getByText(/77\.5/).first()).toBeVisible();
  });

  test("capture D09 UI screenshots @ 1440", async ({ page }) => {
    test.skip(!stockItemId, "fixture missing");
    const out = path.resolve(__dirname, "../../../docs/release/audit-screenshots/d09");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/assets/non-asset/${stockItemId}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: /issue stock/i })).toBeVisible();
    await page.screenshot({ path: path.join(out, "non-asset-detail-1440-loaded.png"), fullPage: true });
    await page.getByRole("button", { name: /issue stock/i }).click();
    await page.screenshot({ path: path.join(out, "non-asset-issue-form-1440-loaded.png"), fullPage: true });
    await page.getByRole("button", { name: /return stock/i }).click();
    await page.screenshot({ path: path.join(out, "non-asset-return-form-1440-loaded.png"), fullPage: true });
    await page.getByRole("button", { name: /^write off$/i }).click();
    await page.screenshot({ path: path.join(out, "non-asset-writeoff-form-1440-loaded.png"), fullPage: true });
    await page.getByRole("button", { name: /cancel/i }).first().click();
    await expect(page.getByRole("heading", { name: /movement history/i })).toBeVisible();
    await page.screenshot({ path: path.join(out, "non-asset-movement-history-1440-loaded.png"), fullPage: true });
  });
});

import { test, expect } from "@playwright/test";
import { apiPostEnvelope } from "./helpers/api";

test.describe.configure({ mode: "serial", retries: 0 });

test.describe("Wave 3 — inventory (asset vs non-asset)", () => {
  const ts = Date.now();
  const stockCode = `W3-NA-${ts}`;
  let categoryId = "";
  let stockItemId = "";

  test("prepare category via API", async ({ page }) => {
    const cat = await apiPostEnvelope<{ categoryId: string }>(page, "/asset-categories", {
      categoryName: `W3-CAT-${ts}`,
    });
    expect(cat.status).toBe(201);
    categoryId = cat.json.data.categoryId;
  });

  test("register non-asset via API and verify detail UI", async ({ page }) => {
    test.skip(!categoryId, "category missing");

    const vendor = await apiPostEnvelope<{ vendorId: string }>(page, "/vendors", {
      vendorName: `W3-INV-V-${ts}`,
    });
    expect(vendor.status).toBe(201);
    const po = await apiPostEnvelope<{ purchaseOrderId: string; poNumber: string }>(
      page,
      "/purchase-orders",
      {
        poNumber: `W3-PO-ST-${ts}`,
        vendorId: vendor.json.data.vendorId,
        poDate: "2026-06-01",
        currency: "USD",
      },
    );
    expect(po.status).toBe(201);

    const created = await apiPostEnvelope<{
      stockItemId: string;
      stockCode: string;
      quantityOnHand: string;
      unitOfMeasure: string;
      stockReceivedDate: string;
      purchaseOrder: { poNumber: string };
    }>(page, "/non-asset-stock-items", {
      stockCode,
      itemName: "Wave3 test cable",
      itemType: "Consumable",
      categoryId,
      quantityOnHand: 25,
      unitOfMeasure: "FEET",
      stockReceivedDate: "2026-06-15",
      purchaseOrderId: po.json.data.purchaseOrderId,
      currentLocation: "Store B",
    });
    expect(created.status).toBe(201);
    expect(created.json.data.unitOfMeasure).toBe("FEET");
    expect(Number(created.json.data.quantityOnHand)).toBe(25);
    expect(created.json.data.purchaseOrder.poNumber).toBe(`W3-PO-ST-${ts}`);
    stockItemId = created.json.data.stockItemId;

    await page.goto(`/assets/non-asset/${stockItemId}`);
    await expect(page.getByText("Wave3 test cable")).toBeVisible();
    await expect(page.getByText(/25.*FEET/i).first()).toBeVisible();
    await expect(page.getByText(/consumable/i)).toBeVisible();
    await expect(page.getByText("2026-06-15")).toBeVisible();
    await expect(page.getByRole("link", { name: `W3-PO-ST-${ts}` })).toBeVisible();
  });

  test("asset vs non-asset selection on stock entry", async ({ page }) => {
    await page.goto("/assets/new");
    await expect(page.getByRole("button", { name: /serialized asset/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /non-asset stock/i })).toBeVisible();
  });

  test("stock entry form submits to detail (UI)", async ({ page }) => {
    test.skip(!categoryId, "category missing");
    const code = `${stockCode}-UI-${Date.now()}`;
    await page.goto("/assets/new");
    await page.getByRole("button", { name: /non-asset stock/i }).click();
    await page.locator("#stockCode").fill(code);
    await page.locator("#itemName").fill("UI entry item");
    await page.locator("#na-categoryId").selectOption(categoryId);
    await page.locator("#quantityOnHand").fill("3");
    await page.locator("#unitOfMeasure").selectOption("EACH");
    await page.locator("#stockReceivedDate").fill("2026-06-20");
    await page.getByRole("button", { name: /save stock entry/i }).click();
    await expect(page.getByText(/non-asset stock recorded|stock entry failed/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page).toHaveURL(/\/assets\/non-asset\//, { timeout: 30_000 });
  });

  test("non-asset appears in inventory list", async ({ page }) => {
    await page.goto("/assets?view=non-asset", { waitUntil: "networkidle" });
    const search = page.getByRole("textbox", { name: "Search", exact: true });
    await expect(search).toBeVisible({ timeout: 20_000 });
    await search.fill(stockCode);
    await expect(page.getByRole("link", { name: stockCode, exact: true })).toBeVisible({ timeout: 20_000 });
  });

  test("serialized asset path still available", async ({ page }) => {
    await page.goto("/assets/new");
    await page.getByRole("button", { name: /serialized asset/i }).click();
    await expect(page.locator("#assetCode")).toBeVisible();
  });
});

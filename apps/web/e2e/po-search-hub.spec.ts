import { test, expect } from "@playwright/test";
import { apiPostEnvelope, apiGetEnvelope } from "./helpers/api";

/**
 * Focused regression for confirmed search-hub field mappings and non-asset stock section.
 * Uses API setup + UI assertions only — no new business workflows.
 */
test.describe("PO search hub — field and non-asset regression", () => {
  const ts = Date.now();
  const poNumber = `E2E-SRCH-${ts}`;
  const softwareName = `E2E-Soft-${ts}`;
  const itemName = `E2E cable reel ${ts}`;
  const employeeNumber = `E2E-EN-${ts}`;
  let purchaseOrderId = "";

  test("seed PO with license, employee issuance, and non-asset stock", async ({ page }) => {
    const vendor = await apiPostEnvelope<{ vendorId: string }>(page, "/vendors", {
      vendorName: `E2E-SRCH-V-${ts}`,
    });
    expect(vendor.status).toBe(201);

    const emp = await apiPostEnvelope<{ employeeId: string }>(page, "/employees", {
      employeeNumber,
      fullName: "E2E Search Employee",
      department: "IT",
    });
    expect(emp.status).toBe(201);

    const cat = await apiPostEnvelope<{ categoryId: string }>(page, "/asset-categories", {
      categoryName: `E2E-SRCH-C-${ts}`,
    });
    expect(cat.status).toBe(201);

    const po = await apiPostEnvelope<{ purchaseOrderId: string; poNumber: string }>(
      page,
      "/purchase-orders",
      {
        poNumber,
        vendorId: vendor.json.data.vendorId,
        poDate: "2026-07-01",
        currency: "USD",
      },
    );
    expect(po.status).toBe(201);
    purchaseOrderId = po.json.data.purchaseOrderId;

    const asset = await apiPostEnvelope<{ assetId: string }>(page, "/assets", {
      assetCode: `E2E-A-${ts}`,
      assetName: "E2E Search Asset",
      categoryId: cat.json.data.categoryId,
      purchaseOrderId,
    });
    expect(asset.status).toBe(201);

    const issue = await apiPostEnvelope(page, "/asset-issuances", {
      employeeId: emp.json.data.employeeId,
      referenceNumber: `E2E-ISS-${ts}`,
      assets: [{ assetId: asset.json.data.assetId }],
    });
    expect(issue.status).toBe(201);

    const license = await apiPostEnvelope(page, "/software-licenses", {
      softwareName,
      startDate: "2026-01-01",
      expiryDate: "2027-01-01",
      licenseQuantity: 1,
      purchaseOrderId,
    });
    expect(license.status).toBe(201);

    const stock = await apiPostEnvelope(page, "/non-asset-stock-items", {
      stockCode: `E2E-NA-${ts}`,
      itemName,
      itemType: "Cable",
      categoryId: cat.json.data.categoryId,
      quantityOnHand: 75,
      unitOfMeasure: "FEET",
      purchaseOrderId,
      stockReceivedDate: "2026-07-02",
    });
    expect(stock.status).toBe(201);

    const searchApi = await apiGetEnvelope<{
      movements: Array<{ employee?: { employeeNumber?: string; employeeCode?: string } | null }>;
      softwareLicenses: Array<{ softwareName?: string; productName?: string }>;
      nonAssetStockItems: Array<{
        itemName: string;
        quantityOnHand: string;
        quantityAvailable: string;
        unitOfMeasure: string;
      }>;
    }>(page, `/search/purchase-orders/${encodeURIComponent(poNumber)}`);
    expect(searchApi.status).toBe(200);
    expect(
      searchApi.json.data.movements.some((m) => m.employee?.employeeNumber === employeeNumber),
    ).toBe(true);
    expect(searchApi.json.data.movements.every((m) => !m.employee || !("employeeCode" in m.employee))).toBe(
      true,
    );
    expect(searchApi.json.data.softwareLicenses.some((l) => l.softwareName === softwareName)).toBe(true);
    expect(searchApi.json.data.softwareLicenses.every((l) => !("productName" in l))).toBe(true);
    expect(searchApi.json.data.nonAssetStockItems.some((s) => s.itemName === itemName)).toBe(true);
  });

  test("UI shows software name, employee number, and non-asset stock", async ({ page }) => {
    test.skip(!purchaseOrderId, "seed failed");

    await page.goto("/search");
    await page.locator("#po-search").fill(poNumber);
    await page.getByRole("button", { name: /^search$/i }).click();

    await expect(page.getByText(poNumber).first()).toBeVisible({ timeout: 20_000 });

    await page.getByRole("tab", { name: /licenses/i }).click();
    await expect(page.getByRole("link", { name: softwareName })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("tab", { name: /issuance|returns/i }).click();
    await expect(page.getByText(new RegExp(`${employeeNumber}`))).toBeVisible({ timeout: 15_000 });

    await page.getByRole("tab", { name: /non-asset stock/i }).click();
    await expect(page.getByRole("link", { name: itemName })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("FEET").first()).toBeVisible();
    await expect(page.getByText("75").first()).toBeVisible();
    await expect(page.getByText(poNumber).first()).toBeVisible();
  });
});

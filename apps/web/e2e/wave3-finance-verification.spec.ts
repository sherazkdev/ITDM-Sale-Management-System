import { test, expect } from "@playwright/test";
import { apiPostEnvelope } from "./helpers/api";

test.describe.configure({ mode: "serial", timeout: 180_000, retries: 0 });

test.describe("Wave 3 — financial verification (UI + API)", () => {
  const ts = Date.now();
  let budgetId = "";
  let poId = "";
  let invoiceIdA = "";
  let invoiceIdB = "";
  const poNumber = `W3-PO-${ts}`;
  const vendorName = `W3 Vendor ${ts}`;

  test("setup budget, vendor, PO via API", async ({ page }) => {
    const year = await apiPostEnvelope<{ financialYearId: string }>(page, "/financial-years", {
      yearName: `W3-FY-${ts}`,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      status: "OPEN",
    });
    expect(year.status).toBe(201);

    const alloc = await apiPostEnvelope<{ budgetId: string }>(page, "/budget-allocations", {
      financialYearId: year.json.data.financialYearId,
      budgetCategory: "Wave3 QA",
      allocatedAmount: 50_000,
      currency: "USD",
    });
    expect(alloc.status).toBe(201);
    budgetId = alloc.json.data.budgetId;

    const vendor = await apiPostEnvelope<{ vendorId: string }>(page, "/vendors", {
      vendorName,
    });
    expect(vendor.status).toBe(201);

    const po = await apiPostEnvelope<{ purchaseOrderId: string }>(page, "/purchase-orders", {
      poNumber,
      vendorId: vendor.json.data.vendorId,
      poDate: "2026-05-01",
      currency: "USD",
    });
    expect(po.status).toBe(201);
    poId = po.json.data.purchaseOrderId;
  });

  test("create two invoices on same PO", async ({ page }) => {
    test.skip(!poId, "PO missing");

    await page.goto(`/invoices/new?po=${encodeURIComponent(poNumber)}`);
    await page.locator("#invoiceNumber").fill(`W3-INV-A-${ts}`);
    await page.getByLabel(/^purchase order$/i).selectOption({ index: 1 });
    await page.getByLabel(/invoice date/i).fill("2026-05-10");
    await page.locator("#invoiceAmount").fill("1000");
    await page.getByRole("button", { name: /create invoice/i }).click();
    await expect(page).toHaveURL(/\/invoices\/\d+$/);
    invoiceIdA = page.url().split("/").pop() ?? "";

    await page.goto(`/invoices/new?po=${encodeURIComponent(poNumber)}`);
    await page.locator("#invoiceNumber").fill(`W3-INV-B-${ts}`);
    await page.getByLabel(/^purchase order$/i).selectOption({ index: 1 });
    await page.getByLabel(/invoice date/i).fill("2026-05-12");
    await page.locator("#invoiceAmount").fill("500");
    await page.getByRole("button", { name: /create invoice/i }).click();
    await expect(page).toHaveURL(/\/invoices\/\d+$/);
    invoiceIdB = page.url().split("/").pop() ?? "";
  });

  test("payment before post is blocked in UI", async ({ page }) => {
    test.skip(!invoiceIdA, "invoice missing");
    const blocked = await apiPostEnvelope(page, `/invoices/${invoiceIdA}/payments`, {
      amount: 1,
      idempotencyKey: `pre-post-${ts}`,
    });
    expect(blocked.status).toBe(409);

    await page.goto(`/invoices/${invoiceIdA}`);
    await expect(page.getByRole("button", { name: /post invoice/i })).toBeVisible();
    await expect(page.getByText(/before recording payments/i)).toBeVisible();
  });

  test("post invoice, partial pay, balance matches API", async ({ page }) => {
    test.skip(!invoiceIdA || !budgetId, "setup missing");
    const postA = await apiPostEnvelope(page, `/invoices/${invoiceIdA}/post`, { budgetId });
    expect(postA.status).toBe(200);

    await page.goto(`/invoices/${invoiceIdA}`);
    await page.locator("#amount").fill("400");
    await page.getByRole("button", { name: /record payment/i }).click();
    await expect(page.getByText(/payment recorded/i)).toBeVisible({ timeout: 20_000 });

    const balRes = await page.request.get(`/api/v1/invoices/${invoiceIdA}/balance`);
    const bal = (await balRes.json()) as { data: { outstanding: string; paidTotal: string } };
    expect(bal.data.outstanding).toBe("600");
    expect(bal.data.paidTotal).toBe("400");

    await expect(page.getByText(/600(\.00)?/)).toBeVisible();
  });

  test("post second invoice and budget committed totals", async ({ page }) => {
    test.skip(!invoiceIdB || !budgetId, "setup missing");
    const postB = await apiPostEnvelope(page, `/invoices/${invoiceIdB}/post`, { budgetId });
    expect(postB.status).toBe(200);

    const poInvoices = await page.request.get(`/api/v1/purchase-orders/${poId}/invoices`);
    const poBody = (await poInvoices.json()) as { data: unknown[] };
    expect(poBody.data.length).toBeGreaterThanOrEqual(2);

    const summaryRes = await page.request.get(`/api/v1/budgets/${budgetId}/summary`);
    const summary = (await summaryRes.json()) as {
      data: { committedUsd: string; actualPaidUsd: string };
    };
    expect(Number(summary.data.committedUsd)).toBeGreaterThanOrEqual(1500);
    expect(Number(summary.data.actualPaidUsd)).toBe(400);
  });

  test("payment idempotency via API", async ({ page }) => {
    test.skip(!invoiceIdA, "invoice missing");
    const key = `w3-idem-${ts}`;
    const headers = { "x-itdms-requested-with": "itdms", "Content-Type": "application/json" };
    const body = { amount: 50, idempotencyKey: key };
    const first = await page.request.post(`/api/v1/invoices/${invoiceIdA}/payments`, {
      headers,
      data: body,
    });
    const second = await page.request.post(`/api/v1/invoices/${invoiceIdA}/payments`, {
      headers,
      data: body,
    });
    expect(first.status()).toBe(201);
    expect(second.status()).toBe(201);
    const balRes = await page.request.get(`/api/v1/invoices/${invoiceIdA}/balance`);
    const bal = (await balRes.json()) as { data: { paidTotal: string } };
    expect(Number(bal.data.paidTotal)).toBe(450);
  });
});

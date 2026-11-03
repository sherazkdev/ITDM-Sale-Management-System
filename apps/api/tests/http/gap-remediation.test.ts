import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";
import { createUsdBudgetAllocation, postInvoiceToBudget } from "../helpers/finance-test.js";

describe("Gap remediation — budget, search, documents, exports", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("budget year → allocation → ledger → summary and by-po", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();

    const year = await request(app)
      .post("/api/v1/financial-years")
      .set(sessionRequestHeaders(cookie))
      .send({
        yearName: `FY-${ts}`,
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        status: "OPEN",
      })
      .expect(201);

    const alloc = await request(app)
      .post("/api/v1/budget-allocations")
      .set(sessionRequestHeaders(cookie))
      .send({
        financialYearId: year.body.data.financialYearId,
        budgetCategory: "Hardware",
        allocatedAmount: 10000,
        currency: "USD",
      })
      .expect(201);

    const vendor = await request(app)
      .post("/api/v1/vendors")
      .set(sessionRequestHeaders(cookie))
      .send({ vendorName: `BV-${ts}` })
      .expect(201);

    const po = await request(app)
      .post("/api/v1/purchase-orders")
      .set(sessionRequestHeaders(cookie))
      .send({
        poNumber: `PO-B-${ts}`,
        vendorId: vendor.body.data.vendorId,
        poDate: "2026-03-01",
        currency: "USD",
        validUntil: "2026-12-31",
      })
      .expect(201);

    await request(app)
      .post("/api/v1/budget-ledger/entries")
      .set(sessionRequestHeaders(cookie))
      .send({
        budgetId: alloc.body.data.budgetId,
        transactionType: "manual_spend_proposed",
        amount: 1500,
        transactionDate: "2026-03-15",
        purchaseOrderId: po.body.data.purchaseOrderId,
        remarks: "test ledger",
      })
      .expect(201);

    const summary = await request(app)
      .get(`/api/v1/budgets/${alloc.body.data.budgetId}/summary`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(Number(summary.body.data.remainingUsd)).toBe(10000);
    expect(Number(summary.body.data.manualLedgerTotal)).toBe(1500);

    const byPo = await request(app)
      .get(`/api/v1/budgets/by-po/${po.body.data.purchaseOrderId}`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(byPo.body.data.transactions.length).toBeGreaterThan(0);
  });

  it("links uploaded document to PO and returns it in global search", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();

    const vendor = await request(app)
      .post("/api/v1/vendors")
      .set(sessionRequestHeaders(cookie))
      .send({ vendorName: `SD-${ts}` })
      .expect(201);
    const po = await request(app)
      .post("/api/v1/purchase-orders")
      .set(sessionRequestHeaders(cookie))
      .send({
        poNumber: `PO-S-${ts}`,
        vendorId: vendor.body.data.vendorId,
        poDate: "2026-04-01",
        currency: "USD",
      })
      .expect(201);
    const poId = po.body.data.purchaseOrderId as string;

    const contentBase64 = Buffer.from("attachment").toString("base64");
    await request(app)
      .post("/api/v1/documents/uploads")
      .set(sessionRequestHeaders(cookie))
      .send({
        ownerType: "purchase_order",
        ownerId: poId,
        originalFileName: "po-note.txt",
        mimeType: "text/plain",
        contentBase64,
      })
      .expect(201);

    const search = await request(app)
      .get(`/api/v1/search/purchase-orders/PO-S-${ts}`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(search.body.data.supportingDocuments.purchaseOrder.length).toBeGreaterThan(0);
    expect(search.body.data.expiryDates).toBeDefined();
    expect(search.body.data.invoiceFinancials).toBeDefined();
  });

  it("lists invoice payments and serves non-official PDF export header", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();

    const vendor = await request(app)
      .post("/api/v1/vendors")
      .set(sessionRequestHeaders(cookie))
      .send({ vendorName: `IV-${ts}` })
      .expect(201);
    const po = await request(app)
      .post("/api/v1/purchase-orders")
      .set(sessionRequestHeaders(cookie))
      .send({
        poNumber: `PO-I-${ts}`,
        vendorId: vendor.body.data.vendorId,
        poDate: "2026-04-01",
        currency: "USD",
      })
      .expect(201);
    const invoice = await request(app)
      .post("/api/v1/invoices")
      .set(sessionRequestHeaders(cookie))
      .send({
        invoiceNumber: `INV-R-${ts}`,
        purchaseOrderId: po.body.data.purchaseOrderId,
        invoiceDate: "2026-04-10",
        invoiceAmount: 500,
      })
      .expect(201);

    const { budgetId } = await createUsdBudgetAllocation(app, cookie, ts);
    await postInvoiceToBudget(app, cookie, invoice.body.data.invoiceId, budgetId);

    await request(app)
      .post(`/api/v1/invoices/${invoice.body.data.invoiceId}/payments`)
      .set(sessionRequestHeaders(cookie))
      .send({ amount: 200, idempotencyKey: `rem-${ts}` })
      .expect(201);

    const payments = await request(app)
      .get(`/api/v1/invoices/${invoice.body.data.invoiceId}/payments`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(payments.body.data.length).toBe(1);

    const pdf = await request(app)
      .get("/api/v1/reports/asset-register?format=pdf")
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(pdf.headers["x-itdms-export-disclaimer"]).toBe("NON-OFFICIAL-D12");
    expect(pdf.headers["content-type"]).toMatch(/pdf/);
  });

  it("user admin lists roles and users", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    await request(app).get("/api/v1/users/roles").set(sessionRequestHeaders(cookie)).expect(200);
    const users = await request(app).get("/api/v1/users").set(sessionRequestHeaders(cookie)).expect(200);
    expect(users.body.data.length).toBeGreaterThan(0);
  });
});

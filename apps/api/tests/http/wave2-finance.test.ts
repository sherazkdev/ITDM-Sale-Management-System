import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";
import { createUsdBudgetAllocation, postInvoiceToBudget } from "../helpers/finance-test.js";

describe("Wave 2 — financial rules", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("requires post before payment and tracks partial actual USD", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();

    const vendor = await request(app)
      .post("/api/v1/vendors")
      .set(sessionRequestHeaders(cookie))
      .send({ vendorName: `W2-${ts}` })
      .expect(201);
    const po = await request(app)
      .post("/api/v1/purchase-orders")
      .set(sessionRequestHeaders(cookie))
      .send({
        poNumber: `PO-W2-${ts}`,
        vendorId: vendor.body.data.vendorId,
        poDate: "2026-03-01",
        currency: "USD",
      })
      .expect(201);
    const invoice = await request(app)
      .post("/api/v1/invoices")
      .set(sessionRequestHeaders(cookie))
      .send({
        invoiceNumber: `INV-W2-${ts}`,
        purchaseOrderId: po.body.data.purchaseOrderId,
        invoiceDate: "2026-03-05",
        invoiceAmount: 1000,
      })
      .expect(201);
    const invoiceId = invoice.body.data.invoiceId as string;

    await request(app)
      .post(`/api/v1/invoices/${invoiceId}/payments`)
      .set(sessionRequestHeaders(cookie))
      .send({ amount: 100, idempotencyKey: `pre-post-${ts}` })
      .expect(409);

    const { budgetId } = await createUsdBudgetAllocation(app, cookie, ts, 5000);
    await postInvoiceToBudget(app, cookie, invoiceId, budgetId);

    await request(app)
      .post(`/api/v1/invoices/${invoiceId}/payments`)
      .set(sessionRequestHeaders(cookie))
      .send({ amount: 400, idempotencyKey: `pay-${ts}` })
      .expect(201);

    const summary = await request(app)
      .get(`/api/v1/budgets/${budgetId}/summary`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(Number(summary.body.data.committedUsd)).toBe(1000);
    expect(Number(summary.body.data.actualPaidUsd)).toBe(400);
    expect(Number(summary.body.data.remainingUsd)).toBe(4600);
  });

  it("applies manual FX on non-USD payment date", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now() + 1;

    const vendor = await request(app)
      .post("/api/v1/vendors")
      .set(sessionRequestHeaders(cookie))
      .send({ vendorName: `FX-${ts}` })
      .expect(201);
    const po = await request(app)
      .post("/api/v1/purchase-orders")
      .set(sessionRequestHeaders(cookie))
      .send({
        poNumber: `PO-FX-${ts}`,
        vendorId: vendor.body.data.vendorId,
        poDate: "2026-04-01",
        currency: "EUR",
      })
      .expect(201);
    const invoice = await request(app)
      .post("/api/v1/invoices")
      .set(sessionRequestHeaders(cookie))
      .send({
        invoiceNumber: `INV-FX-${ts}`,
        purchaseOrderId: po.body.data.purchaseOrderId,
        invoiceDate: "2026-04-05",
        invoiceAmount: 100,
      })
      .expect(201);
    const invoiceId = invoice.body.data.invoiceId as string;
    const { budgetId } = await createUsdBudgetAllocation(app, cookie, ts);
    await postInvoiceToBudget(app, cookie, invoiceId, budgetId, 1.1);

    await request(app)
      .post(`/api/v1/invoices/${invoiceId}/payments`)
      .set(sessionRequestHeaders(cookie))
      .send({
        amount: 50,
        exchangeRateToUsd: 1.2,
        idempotencyKey: `fx-${ts}`,
      })
      .expect(201);

    const bal = await request(app)
      .get(`/api/v1/invoices/${invoiceId}/balance`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(Number(bal.body.data.paidTotalUsd)).toBe(60);
  });
});

import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";
import { createUsdBudgetAllocation, postInvoiceToBudget } from "../helpers/finance-test.js";

describe("Procurement and billing flow", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("links vendor, contract, PO lines, invoices, payments, and search", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();

    const vendor = await request(app)
      .post("/api/v1/vendors")
      .set(sessionRequestHeaders(cookie))
      .send({ vendorName: `V-${ts}` })
      .expect(201);
    const vendorId = vendor.body.data.vendorId as string;

    const contract = await request(app)
      .post("/api/v1/contracts")
      .set(sessionRequestHeaders(cookie))
      .send({
        contractNumber: `CN-${ts}`,
        vendorId,
        startDate: "2026-01-01",
        expiryDate: "2027-01-01",
        contractValue: 50000,
      })
      .expect(201);

    const po = await request(app)
      .post("/api/v1/purchase-orders")
      .set(sessionRequestHeaders(cookie))
      .send({
        poNumber: `PO-${ts}`,
        vendorId,
        contractId: contract.body.data.contractId,
        poDate: "2026-02-01",
        currency: "USD",
      })
      .expect(201);
    const poId = po.body.data.purchaseOrderId as string;

    await request(app)
      .post(`/api/v1/purchase-orders/${poId}/lines`)
      .set(sessionRequestHeaders(cookie))
      .send({
        lineNumber: 1,
        description: "Laptops",
        lineType: "goods",
        quantity: 2,
        unitPrice: 1000,
      })
      .expect(200);

    const poDetail = await request(app)
      .get(`/api/v1/purchase-orders/${poId}`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(Number(poDetail.body.data.totalAmount)).toBe(2000);

    const invoice = await request(app)
      .post("/api/v1/invoices")
      .set(sessionRequestHeaders(cookie))
      .send({
        invoiceNumber: `INV-${ts}`,
        purchaseOrderId: poId,
        invoiceDate: "2026-02-15",
        invoiceAmount: 2000,
      })
      .expect(201);
    const invoiceId = invoice.body.data.invoiceId as string;

    const { budgetId } = await createUsdBudgetAllocation(app, cookie, ts);
    await postInvoiceToBudget(app, cookie, invoiceId, budgetId);

    await request(app)
      .post(`/api/v1/invoices/${invoiceId}/payments`)
      .set(sessionRequestHeaders(cookie))
      .send({ amount: 800, idempotencyKey: `pay-${ts}-1` })
      .expect(201);

    const balance = await request(app)
      .get(`/api/v1/invoices/${invoiceId}/balance`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(balance.body.data.paymentStatus).toBe("PARTIAL");
    expect(Number(balance.body.data.outstanding)).toBe(1200);

    await request(app)
      .post(`/api/v1/invoices/${invoiceId}/payments`)
      .set(sessionRequestHeaders(cookie))
      .send({ amount: 500, idempotencyKey: `pay-${ts}-1` })
      .expect(201);
    expect(Number(
      (await request(app).get(`/api/v1/invoices/${invoiceId}/balance`).set(sessionRequestHeaders(cookie))).body
        .data.outstanding,
    )).toBe(1200);

    await request(app)
      .post(`/api/v1/invoices/${invoiceId}/payments`)
      .set(sessionRequestHeaders(cookie))
      .send({ amount: 1200, idempotencyKey: `pay-${ts}-2` })
      .expect(201);

    const paid = await request(app)
      .get(`/api/v1/invoices/${invoiceId}/balance`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(paid.body.data.paymentStatus).toBe("PAID");

    const search = await request(app)
      .get(`/api/v1/search/purchase-orders/PO-${ts}`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(search.body.data.purchaseOrder.poNumber).toBe(`PO-${ts}`);
    expect(search.body.data.purchaseOrder.invoices.length).toBeGreaterThan(0);
  });

  it("blocks PO submit workflow pending D03", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const list = await request(app)
      .get("/api/v1/purchase-orders")
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    const poId = list.body.data[0]?.purchaseOrderId;
    if (!poId) {
      return;
    }
    const res = await request(app)
      .post(`/api/v1/purchase-orders/${poId}/submit`)
      .set(sessionRequestHeaders(cookie))
      .expect(403);
    expect(res.body.error.code).toBe("POLICY_NOT_APPROVED");
  });
});

import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";
import { createUsdBudgetAllocation } from "../helpers/finance-test.js";

describe("Business Phase 2 — budget semantics", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  async function seedPoInvoice(
    app: ReturnType<typeof buildApplication>["app"],
    cookie: string,
    ts: number,
    amount: number,
    invoiceNo: string,
  ) {
    const vendor = await request(app)
      .post("/api/v1/vendors")
      .set(sessionRequestHeaders(cookie))
      .send({ vendorName: `B2-${ts}-${invoiceNo}` })
      .expect(201);
    const po = await request(app)
      .post("/api/v1/purchase-orders")
      .set(sessionRequestHeaders(cookie))
      .send({
        poNumber: `B2-PO-${ts}-${invoiceNo}`,
        vendorId: vendor.body.data.vendorId,
        poDate: "2026-06-01",
        currency: "USD",
      })
      .expect(201);
    const invoice = await request(app)
      .post("/api/v1/invoices")
      .set(sessionRequestHeaders(cookie))
      .send({
        invoiceNumber: invoiceNo,
        purchaseOrderId: po.body.data.purchaseOrderId,
        invoiceDate: "2026-06-05",
        invoiceAmount: amount,
      })
      .expect(201);
    return {
      invoiceId: invoice.body.data.invoiceId as string,
      purchaseOrderId: po.body.data.purchaseOrderId as string,
    };
  }

  async function readSummary(
    app: ReturnType<typeof buildApplication>["app"],
    cookie: string,
    budgetId: string,
  ) {
    const summary = await request(app)
      .get(`/api/v1/budgets/${budgetId}/summary`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    return summary.body.data as {
      committedUsd: string;
      utilizedUsd: string;
      actualPaidUsd: string;
      remainingUsd: string | null;
    };
  }

  it("scenario A — two posted invoices, fully paid", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();
    const { budgetId } = await createUsdBudgetAllocation(app, cookie, ts, 1000);
    const a = await seedPoInvoice(app, cookie, ts, 200, `B2-A1-${ts}`);
    const b = await seedPoInvoice(app, cookie, ts, 300, `B2-A2-${ts}`);

    await request(app)
      .post(`/api/v1/invoices/${a.invoiceId}/post`)
      .set(sessionRequestHeaders(cookie))
      .send({ budgetId })
      .expect(200);
    await request(app)
      .post(`/api/v1/invoices/${b.invoiceId}/post`)
      .set(sessionRequestHeaders(cookie))
      .send({ budgetId })
      .expect(200);

    for (const id of [a.invoiceId, b.invoiceId]) {
      await request(app)
        .post(`/api/v1/invoices/${id}/payments`)
        .set(sessionRequestHeaders(cookie))
        .send({ amount: id === a.invoiceId ? 200 : 300, idempotencyKey: `pay-${id}` })
        .expect(201);
    }

    const s = await readSummary(app, cookie, budgetId);
    expect(Number(s.utilizedUsd ?? s.committedUsd)).toBe(500);
    expect(Number(s.actualPaidUsd)).toBe(500);
    expect(Number(s.remainingUsd)).toBe(500);
  });

  it("scenario B — partial payment does not reduce remaining twice", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now() + 1;
    const { budgetId } = await createUsdBudgetAllocation(app, cookie, ts, 1000);
    const inv = await seedPoInvoice(app, cookie, ts, 300, `B2-B-${ts}`);
    await request(app)
      .post(`/api/v1/invoices/${inv.invoiceId}/post`)
      .set(sessionRequestHeaders(cookie))
      .send({ budgetId })
      .expect(200);
    await request(app)
      .post(`/api/v1/invoices/${inv.invoiceId}/payments`)
      .set(sessionRequestHeaders(cookie))
      .send({ amount: 100, idempotencyKey: `pay-b-${ts}` })
      .expect(201);

    const s = await readSummary(app, cookie, budgetId);
    expect(Number(s.utilizedUsd ?? s.committedUsd)).toBe(300);
    expect(Number(s.actualPaidUsd)).toBe(100);
    expect(Number(s.remainingUsd)).toBe(700);
  });

  it("scenario C — draft invoice does not utilize budget", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now() + 2;
    const { budgetId } = await createUsdBudgetAllocation(app, cookie, ts, 1000);
    await seedPoInvoice(app, cookie, ts, 250, `B2-C-${ts}`);
    const s = await readSummary(app, cookie, budgetId);
    expect(Number(s.utilizedUsd ?? s.committedUsd)).toBe(0);
    expect(Number(s.actualPaidUsd)).toBe(0);
    expect(Number(s.remainingUsd)).toBe(1000);
  });

  it("rejects duplicate invoice post (no double commitment)", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now() + 3;
    const { budgetId } = await createUsdBudgetAllocation(app, cookie, ts, 1000);
    const inv = await seedPoInvoice(app, cookie, ts, 100, `B2-DUP-${ts}`);
    await request(app)
      .post(`/api/v1/invoices/${inv.invoiceId}/post`)
      .set(sessionRequestHeaders(cookie))
      .send({ budgetId })
      .expect(200);
    await request(app)
      .post(`/api/v1/invoices/${inv.invoiceId}/post`)
      .set(sessionRequestHeaders(cookie))
      .send({ budgetId })
      .expect(409);
    const s = await readSummary(app, cookie, budgetId);
    expect(Number(s.utilizedUsd ?? s.committedUsd)).toBe(100);
  });

  it("rejects non-USD budget allocation", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now() + 4;
    const year = await request(app)
      .post("/api/v1/financial-years")
      .set(sessionRequestHeaders(cookie))
      .send({
        yearName: `B2-FY-${ts}`,
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        status: "OPEN",
      })
      .expect(201);
    const bad = await request(app)
      .post("/api/v1/budget-allocations")
      .set(sessionRequestHeaders(cookie))
      .send({
        financialYearId: year.body.data.financialYearId,
        budgetCategory: "EUR attempt",
        allocatedAmount: 1000,
        currency: "EUR",
      })
      .expect(422);
    expect(bad.body.error.code).toBe("VALIDATION_ERROR");
  });
});

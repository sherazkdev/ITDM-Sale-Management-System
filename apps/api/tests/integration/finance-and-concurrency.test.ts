import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";
import { createUsdBudgetAllocation, postInvoiceToBudget } from "../helpers/finance-test.js";

describe("Finance integrity and concurrent issuance", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  async function createMinimalInvoice(app: ReturnType<typeof buildApplication>["app"], cookie: string, ts: number) {
    const vendor = await request(app)
      .post("/api/v1/vendors")
      .set(sessionRequestHeaders(cookie))
      .send({ vendorName: `V-${ts}` })
      .expect(201);
    const contract = await request(app)
      .post("/api/v1/contracts")
      .set(sessionRequestHeaders(cookie))
      .send({
        vendorId: vendor.body.data.vendorId,
        contractNumber: `C-${ts}`,
        startDate: "2026-01-01",
        expiryDate: "2027-01-01",
      })
      .expect(201);
    const po = await request(app)
      .post("/api/v1/purchase-orders")
      .set(sessionRequestHeaders(cookie))
      .send({
        poNumber: `PO-FIN-${ts}`,
        vendorId: vendor.body.data.vendorId,
        contractId: contract.body.data.contractId,
        poDate: "2026-02-01",
        currency: "USD",
      })
      .expect(201);
    const invoice = await request(app)
      .post("/api/v1/invoices")
      .set(sessionRequestHeaders(cookie))
      .send({
        purchaseOrderId: po.body.data.purchaseOrderId,
        invoiceNumber: `INV-${ts}`,
        invoiceAmount: 1000,
        invoiceDate: "2026-02-15",
      })
      .expect(201);
    return invoice.body.data.invoiceId as string;
  }

  async function postWithBudget(
    app: ReturnType<typeof buildApplication>["app"],
    cookie: string,
    invoiceId: string,
    ts: number,
  ) {
    const { budgetId } = await createUsdBudgetAllocation(app, cookie, ts);
    await postInvoiceToBudget(app, cookie, invoiceId, budgetId);
    return budgetId;
  }

  it("rejects overpayment and idempotency key reuse on another invoice", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();

    const invoiceA = await createMinimalInvoice(app, cookie, ts);
    await postWithBudget(app, cookie, invoiceA, ts);
    const invoiceB = await createMinimalInvoice(app, cookie, ts + 1);
    await postWithBudget(app, cookie, invoiceB, ts + 1000);
    const idem = `idem-${ts}`;

    await request(app)
      .post(`/api/v1/invoices/${invoiceA}/payments`)
      .set(sessionRequestHeaders(cookie))
      .send({ amount: 400, idempotencyKey: idem })
      .expect(201);

    await request(app)
      .post(`/api/v1/invoices/${invoiceA}/payments`)
      .set(sessionRequestHeaders(cookie))
      .send({ amount: 700, idempotencyKey: `pay-extra-${ts}` })
      .expect(409);

    const wrong = await request(app)
      .post(`/api/v1/invoices/${invoiceB}/payments`)
      .set(sessionRequestHeaders(cookie))
      .send({ amount: 100, idempotencyKey: idem })
      .expect(409);
    expect(wrong.body.error.code).toBe("CONFLICT");

    const balA = await request(app)
      .get(`/api/v1/invoices/${invoiceA}/balance`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(Number(balA.body.data.outstanding)).toBe(600);

    const retry = await request(app)
      .post(`/api/v1/invoices/${invoiceA}/payments`)
      .set(sessionRequestHeaders(cookie))
      .send({ amount: 400, idempotencyKey: idem })
      .expect(201);
    expect(Number(retry.body.data.outstanding)).toBe(600);
  });

  it("rolls back multi-asset issue when one asset is ineligible", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now() + 100;

    const employee = await request(app)
      .post("/api/v1/employees")
      .set(sessionRequestHeaders(cookie))
      .send({ employeeNumber: `RB-${ts}`, fullName: "Rollback", department: "Stores" })
      .expect(201);
    const employeeId = employee.body.data.employeeId as string;

    const cat = await request(app)
      .post("/api/v1/asset-categories")
      .set(sessionRequestHeaders(cookie))
      .send({ categoryName: `RB-${ts}` })
      .expect(201);

    const good = await request(app)
      .post("/api/v1/assets")
      .set(sessionRequestHeaders(cookie))
      .send({
        assetCode: `GOOD-${ts}`,
        assetName: "Good",
        categoryId: cat.body.data.categoryId,
      })
      .expect(201);
    const bad = await request(app)
      .post("/api/v1/assets")
      .set(sessionRequestHeaders(cookie))
      .send({
        assetCode: `BAD-${ts}`,
        assetName: "Bad",
        categoryId: cat.body.data.categoryId,
      })
      .expect(201);

    await request(app)
      .post("/api/v1/asset-issuances")
      .set(sessionRequestHeaders(cookie))
      .send({ employeeId, assets: [{ assetId: bad.body.data.assetId }] })
      .expect(201);

    await request(app)
      .post("/api/v1/asset-issuances")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeId,
        assets: [{ assetId: good.body.data.assetId }, { assetId: bad.body.data.assetId }],
      })
      .expect(409);

    const holder = await request(app)
      .get(`/api/v1/assets/${good.body.data.assetId}/current-holder`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(holder.body.data.assetStatus).toBe("IN_STOCK");
  });

  it("allows only one concurrent issue on the same asset", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now() + 200;

    const employee = await request(app)
      .post("/api/v1/employees")
      .set(sessionRequestHeaders(cookie))
      .send({ employeeNumber: `CC-${ts}`, fullName: "Concurrent", department: "Warehouse" })
      .expect(201);
    const employeeId = employee.body.data.employeeId as string;

    const cat = await request(app)
      .post("/api/v1/asset-categories")
      .set(sessionRequestHeaders(cookie))
      .send({ categoryName: `CC-${ts}` })
      .expect(201);

    const asset = await request(app)
      .post("/api/v1/assets")
      .set(sessionRequestHeaders(cookie))
      .send({
        assetCode: `RACE-${ts}`,
        assetName: "Race",
        categoryId: cat.body.data.categoryId,
      })
      .expect(201);
    const assetId = asset.body.data.assetId as string;

    const payload = { employeeId, assets: [{ assetId }] };
    const [r1, r2] = await Promise.all([
      request(app).post("/api/v1/asset-issuances").set(sessionRequestHeaders(cookie)).send(payload),
      request(app).post("/api/v1/asset-issuances").set(sessionRequestHeaders(cookie)).send(payload),
    ]);

    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([201, 409]);
  });
});

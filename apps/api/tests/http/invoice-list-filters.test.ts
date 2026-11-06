import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";

describe("Invoice list search and paymentStatus filters", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("filters by invoice number search and payment status", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();
    const headers = sessionRequestHeaders(cookie);

    const vendor = await request(app)
      .post("/api/v1/vendors")
      .set(headers)
      .send({ vendorName: `INV-LIST-V-${ts}` })
      .expect(201);

    const po = await request(app)
      .post("/api/v1/purchase-orders")
      .set(headers)
      .send({
        poNumber: `INV-LIST-PO-${ts}`,
        vendorId: vendor.body.data.vendorId,
        poDate: "2026-05-01",
        currency: "USD",
      })
      .expect(201);

    const invoiceNumber = `INV-LIST-${ts}`;
    await request(app)
      .post("/api/v1/invoices")
      .set(headers)
      .send({
        invoiceNumber,
        purchaseOrderId: po.body.data.purchaseOrderId,
        invoiceDate: "2026-05-10",
        invoiceAmount: 250,
      })
      .expect(201);

    const byNumber = await request(app)
      .get("/api/v1/invoices")
      .query({ search: invoiceNumber, page: 1, pageSize: 20 })
      .set(headers)
      .expect(200);

    expect(byNumber.body.data.some((row: { invoiceNumber: string }) => row.invoiceNumber === invoiceNumber)).toBe(
      true,
    );

    const byPo = await request(app)
      .get("/api/v1/invoices")
      .query({ search: `INV-LIST-PO-${ts}`, page: 1, pageSize: 20 })
      .set(headers)
      .expect(200);

    expect(byPo.body.data.some((row: { invoiceNumber: string }) => row.invoiceNumber === invoiceNumber)).toBe(
      true,
    );

    const unpaid = await request(app)
      .get("/api/v1/invoices")
      .query({ search: invoiceNumber, paymentStatus: "UNPAID", page: 1, pageSize: 20 })
      .set(headers)
      .expect(200);

    expect(unpaid.body.data).toHaveLength(1);
    expect(unpaid.body.data[0].paymentStatus).toBe("UNPAID");

    const paid = await request(app)
      .get("/api/v1/invoices")
      .query({ search: invoiceNumber, paymentStatus: "PAID", page: 1, pageSize: 20 })
      .set(headers)
      .expect(200);

    expect(paid.body.data).toHaveLength(0);

    await request(app)
      .get("/api/v1/invoices")
      .query({ paymentStatus: "NOT_A_STATUS" })
      .set(headers)
      .expect(400);
  });
});

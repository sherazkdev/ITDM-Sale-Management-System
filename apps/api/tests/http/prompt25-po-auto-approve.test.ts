import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";

describe("Prompt #25 — PO auto approval", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("creates purchase orders in APPROVED status and allows line composition", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();

    const vendor = await request(app)
      .post("/api/v1/vendors")
      .set(sessionRequestHeaders(cookie))
      .send({ vendorName: `AutoV-${ts}` })
      .expect(201);

    const po = await request(app)
      .post("/api/v1/purchase-orders")
      .set(sessionRequestHeaders(cookie))
      .send({
        poNumber: `PO-AUTO-${ts}`,
        vendorId: vendor.body.data.vendorId,
        poDate: "2026-02-01",
        currency: "USD",
      })
      .expect(201);

    expect(po.body.data.status).toBe("APPROVED");

    const poId = po.body.data.purchaseOrderId as string;
    await request(app)
      .post(`/api/v1/purchase-orders/${poId}/lines`)
      .set(sessionRequestHeaders(cookie))
      .send({
        lineNumber: 1,
        description: "Switch",
        lineType: "goods",
        quantity: 1,
        unitPrice: 50,
      })
      .expect(200);
  });
});

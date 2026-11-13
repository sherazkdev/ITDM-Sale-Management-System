import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";
import { loginAsManager, loginAsItStaff } from "../helpers/role-test-sessions.js";

describe("Prompt #25 — finance RBAC", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("manager can read invoices but not create payments", async () => {
    const app = buildApplication().app;
    const adminCookie = await loginAsAdmin(app);
    const managerCookie = await loginAsManager();

    await request(app).get("/api/v1/invoices").set(sessionRequestHeaders(managerCookie)).expect(200);

    const list = await request(app)
      .get("/api/v1/invoices?pageSize=1")
      .set(sessionRequestHeaders(adminCookie))
      .expect(200);
    const invoiceId = list.body.data[0]?.invoiceId;
    if (!invoiceId) {
      return;
    }

    await request(app)
      .post(`/api/v1/invoices/${invoiceId}/payments`)
      .set(sessionRequestHeaders(managerCookie))
      .send({ amount: 1, idempotencyKey: `mgr-block-${Date.now()}` })
      .expect(403);
  });

  it("IT staff cannot read invoices or budgets", async () => {
    const app = buildApplication().app;
    const staffCookie = await loginAsItStaff();

    await request(app).get("/api/v1/invoices").set(sessionRequestHeaders(staffCookie)).expect(403);
    await request(app).get("/api/v1/financial-years").set(sessionRequestHeaders(staffCookie)).expect(403);
  });

  it("search redacts finance for IT staff", async () => {
    const app = buildApplication().app;
    const adminCookie = await loginAsAdmin(app);
    const staffCookie = await loginAsItStaff();
    const ts = Date.now();

    const vendor = await request(app)
      .post("/api/v1/vendors")
      .set(sessionRequestHeaders(adminCookie))
      .send({ vendorName: `RBACV-${ts}` })
      .expect(201);

    const po = await request(app)
      .post("/api/v1/purchase-orders")
      .set(sessionRequestHeaders(adminCookie))
      .send({
        poNumber: `PO-RBAC-${ts}`,
        vendorId: vendor.body.data.vendorId,
        poDate: "2026-02-01",
        currency: "USD",
      })
      .expect(201);

    const adminSearch = await request(app)
      .get(`/api/v1/search/purchase-orders/PO-RBAC-${ts}`)
      .set(sessionRequestHeaders(adminCookie))
      .expect(200);

    const staffSearch = await request(app)
      .get(`/api/v1/search/purchase-orders/PO-RBAC-${ts}`)
      .set(sessionRequestHeaders(staffCookie))
      .expect(200);

    expect(adminSearch.body.data.financeAccess.invoicesVisible).toBe(true);
    expect(staffSearch.body.data.financeAccess.invoicesVisible).toBe(false);
    expect(staffSearch.body.data.purchaseOrder.invoices).toEqual([]);
    expect(po.body.data.purchaseOrderId).toBeTruthy();
  });
});

import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";

describe("Wave 1 — non-asset stock inventory", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("registers non-asset stock with unit and quantity", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();

    const cat = await request(app)
      .post("/api/v1/asset-categories")
      .set(sessionRequestHeaders(cookie))
      .send({ categoryName: `NA-${ts}` })
      .expect(201);

    const created = await request(app)
      .post("/api/v1/non-asset-stock-items")
      .set(sessionRequestHeaders(cookie))
      .send({
        stockCode: `CABLE-${ts}`,
        itemName: "Cat6 cable",
        categoryId: cat.body.data.categoryId,
        quantityOnHand: 100,
        unitOfMeasure: "FEET",
        currentLocation: "Store A",
      })
      .expect(201);

    expect(created.body.data.unitOfMeasure).toBe("FEET");
    expect(Number(created.body.data.quantityOnHand)).toBe(100);

    const list = await request(app)
      .get("/api/v1/non-asset-stock-items?search=CABLE")
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(list.body.data.some((r: { stockCode: string }) => r.stockCode === `CABLE-${ts}`)).toBe(
      true,
    );
  });

  it("rejects duplicate stock codes", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();
    const cat = await request(app)
      .post("/api/v1/asset-categories")
      .set(sessionRequestHeaders(cookie))
      .send({ categoryName: `NA2-${ts}` })
      .expect(201);

    const body = {
      stockCode: `DUP-${ts}`,
      itemName: "Toner",
      categoryId: cat.body.data.categoryId,
      quantityOnHand: 5,
      unitOfMeasure: "EACH",
    };
    await request(app)
      .post("/api/v1/non-asset-stock-items")
      .set(sessionRequestHeaders(cookie))
      .send(body)
      .expect(201);
    const dup = await request(app)
      .post("/api/v1/non-asset-stock-items")
      .set(sessionRequestHeaders(cookie))
      .send(body)
      .expect(409);
    expect(dup.body.error.code).toBe("CONFLICT");
  });

  it("links optional purchase order on register", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();

    const vendor = await request(app)
      .post("/api/v1/vendors")
      .set(sessionRequestHeaders(cookie))
      .send({ vendorName: `NA-PO-${ts}` })
      .expect(201);
    const po = await request(app)
      .post("/api/v1/purchase-orders")
      .set(sessionRequestHeaders(cookie))
      .send({
        poNumber: `PO-NA-${ts}`,
        vendorId: vendor.body.data.vendorId,
        poDate: "2026-06-01",
        currency: "USD",
      })
      .expect(201);
    const cat = await request(app)
      .post("/api/v1/asset-categories")
      .set(sessionRequestHeaders(cookie))
      .send({ categoryName: `NA-PO-CAT-${ts}` })
      .expect(201);

    const created = await request(app)
      .post("/api/v1/non-asset-stock-items")
      .set(sessionRequestHeaders(cookie))
      .send({
        stockCode: `ST-${ts}`,
        itemName: "PO-linked stock",
        itemType: "Consumable",
        categoryId: cat.body.data.categoryId,
        quantityOnHand: 10,
        unitOfMeasure: "KILOGRAM",
        purchaseOrderId: po.body.data.purchaseOrderId,
        stockReceivedDate: "2026-06-02",
      })
      .expect(201);

    expect(created.body.data.purchaseOrder.poNumber).toBe(`PO-NA-${ts}`);
    expect(Number(created.body.data.quantityAvailable)).toBe(10);
  });
});

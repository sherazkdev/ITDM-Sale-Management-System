import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";

describe("PO search hub — field serialization and non-asset stock", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("returns employeeNumber, softwareName, lineSubtotal, and linked non-asset stock", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();

    const vendor = await request(app)
      .post("/api/v1/vendors")
      .set(sessionRequestHeaders(cookie))
      .send({ vendorName: `SRCH-V-${ts}` })
      .expect(201);

    const emp = await request(app)
      .post("/api/v1/employees")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeNumber: `EN-${ts}`,
        fullName: "Search Hub Employee",
        department: "IT",
      })
      .expect(201);

    const cat = await request(app)
      .post("/api/v1/asset-categories")
      .set(sessionRequestHeaders(cookie))
      .send({ categoryName: `SRCH-C-${ts}` })
      .expect(201);

    const po = await request(app)
      .post("/api/v1/purchase-orders")
      .set(sessionRequestHeaders(cookie))
      .send({
        poNumber: `PO-SRCH-${ts}`,
        vendorId: vendor.body.data.vendorId,
        poDate: "2026-07-01",
        currency: "USD",
      })
      .expect(201);
    const poId = po.body.data.purchaseOrderId as string;

    const line = await request(app)
      .post(`/api/v1/purchase-orders/${poId}/lines`)
      .set(sessionRequestHeaders(cookie))
      .send({
        lineNumber: 1,
        description: "Search line",
        lineType: "goods",
        quantity: 2,
        unitPrice: 50,
      })
      .expect(200);
    expect(line.body.data.lines?.[0]?.lineSubtotal ?? line.body.data.lineSubtotal).toBeDefined();

    const asset = await request(app)
      .post("/api/v1/assets")
      .set(sessionRequestHeaders(cookie))
      .send({
        assetCode: `A-SRCH-${ts}`,
        assetName: "Search asset",
        categoryId: cat.body.data.categoryId,
        purchaseOrderId: poId,
      })
      .expect(201);

    await request(app)
      .post("/api/v1/asset-issuances")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeId: emp.body.data.employeeId,
        referenceNumber: `ISS-SRCH-${ts}`,
        assets: [{ assetId: asset.body.data.assetId }],
      })
      .expect(201);

    await request(app)
      .post("/api/v1/software-licenses")
      .set(sessionRequestHeaders(cookie))
      .send({
        softwareName: `SoftSearch-${ts}`,
        startDate: "2026-01-01",
        expiryDate: "2027-01-01",
        licenseQuantity: 1,
        purchaseOrderId: poId,
      })
      .expect(201);

    await request(app)
      .post("/api/v1/non-asset-stock-items")
      .set(sessionRequestHeaders(cookie))
      .send({
        stockCode: `NA-SRCH-${ts}`,
        itemName: "Search cable reel",
        itemType: "Cable",
        categoryId: cat.body.data.categoryId,
        quantityOnHand: 250,
        unitOfMeasure: "FEET",
        purchaseOrderId: poId,
        stockReceivedDate: "2026-07-03",
      })
      .expect(201);

    const search = await request(app)
      .get(`/api/v1/search/purchase-orders/PO-SRCH-${ts}`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);

    const data = search.body.data;
    expect(data.purchaseOrder.poNumber).toBe(`PO-SRCH-${ts}`);
    expect(data.purchaseOrder.lines[0]?.lineSubtotal).toBeDefined();
    expect(data.purchaseOrder.lines[0]?.lineTotal).toBeUndefined();

    const movementEmp = data.movements.find(
      (m: { employee?: { employeeNumber?: string; employeeCode?: string } | null }) =>
        m.employee?.employeeNumber === `EN-${ts}`,
    );
    expect(movementEmp).toBeDefined();
    expect(movementEmp.employee.employeeCode).toBeUndefined();
    expect(movementEmp.employee.fullName).toBe("Search Hub Employee");

    const license = data.softwareLicenses.find(
      (l: { softwareName?: string; productName?: string }) => l.softwareName === `SoftSearch-${ts}`,
    );
    expect(license).toBeDefined();
    expect(license.productName).toBeUndefined();

    expect(Array.isArray(data.nonAssetStockItems)).toBe(true);
    const stock = data.nonAssetStockItems.find(
      (s: { stockCode: string }) => s.stockCode === `NA-SRCH-${ts}`,
    );
    expect(stock).toBeDefined();
    expect(stock.itemName).toBe("Search cable reel");
    expect(stock.unitOfMeasure).toBe("FEET");
    expect(Number(stock.quantityOnHand)).toBe(250);
    expect(Number(stock.quantityAvailable)).toBe(250);
    expect(stock.purchaseOrder?.poNumber).toBe(`PO-SRCH-${ts}`);
    expect(data.truncation.nonAssetStockCap).toBe(200);
  });
});

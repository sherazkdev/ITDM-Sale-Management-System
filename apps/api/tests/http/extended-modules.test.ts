import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";

describe("P12–P18 extended modules", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("maintenance lifecycle and license secret redaction", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();

    const cat = await request(app)
      .post("/api/v1/asset-categories")
      .set(sessionRequestHeaders(cookie))
      .send({ categoryName: `MC-${ts}` })
      .expect(201);
    const asset = await request(app)
      .post("/api/v1/assets")
      .set(sessionRequestHeaders(cookie))
      .send({
        assetCode: `M-${ts}`,
        assetName: "Maintained",
        categoryId: cat.body.data.categoryId,
      })
      .expect(201);

    const m = await request(app)
      .post("/api/v1/maintenance-records")
      .set(sessionRequestHeaders(cookie))
      .send({
        assetId: asset.body.data.assetId,
        maintenanceType: "Repair",
        requestDate: "2026-03-01",
      })
      .expect(201);

    await request(app)
      .post(`/api/v1/maintenance-records/${m.body.data.maintenanceId}/complete`)
      .set(sessionRequestHeaders(cookie))
      .send({ completionDate: "2026-03-05", cost: 100 })
      .expect(200);

    const license = await request(app)
      .post("/api/v1/software-licenses")
      .set(sessionRequestHeaders(cookie))
      .send({
        softwareName: "Office",
        startDate: "2026-01-01",
        expiryDate: "2027-01-01",
        licenseQuantity: 10,
        licenseKeyReference: "SECRET-REF",
      })
      .expect(201);
    expect(license.body.data.licenseKeyReference).toBe("SECRET-REF");

    const list = await request(app)
      .get("/api/v1/software-licenses")
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(list.body.data[0]?.licenseKeyReference).toBeUndefined();
  });

  it("uploads document and non-official PDF report infrastructure", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();
    const contentBase64 = Buffer.from("hello").toString("base64");

    const vendor = await request(app)
      .post("/api/v1/vendors")
      .set(sessionRequestHeaders(cookie))
      .send({ vendorName: `DocV-${ts}` })
      .expect(201);
    const po = await request(app)
      .post("/api/v1/purchase-orders")
      .set(sessionRequestHeaders(cookie))
      .send({
        poNumber: `PO-DOC-${ts}`,
        vendorId: vendor.body.data.vendorId,
        poDate: "2026-05-01",
        currency: "USD",
      })
      .expect(201);

    const up = await request(app)
      .post("/api/v1/documents/uploads")
      .set(sessionRequestHeaders(cookie))
      .send({
        ownerType: "purchase_order",
        ownerId: po.body.data.purchaseOrderId,
        originalFileName: "note.txt",
        mimeType: "text/plain",
        contentBase64,
      })
      .expect(201);

    await request(app)
      .get(`/api/v1/documents/${up.body.data.storedDocumentId}/metadata`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);

    const pdf = await request(app)
      .get("/api/v1/reports/asset-register?format=pdf")
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(pdf.headers["x-itdms-export-disclaimer"]).toBe("NON-OFFICIAL-D12");

    const xlsx = await request(app)
      .get("/api/v1/reports/inventory?format=xlsx")
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(xlsx.headers["content-type"]).toMatch(/excel|spreadsheet/i);
    expect(xlsx.headers["x-itdms-export-disclaimer"]).toBe("NON-OFFICIAL-D12");
    expect(Buffer.isBuffer(xlsx.body) || typeof xlsx.body === "object").toBe(true);

    const csv = await request(app)
      .get("/api/v1/reports/asset-register?format=csv")
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(csv.text).toContain("assetCode");
  });

  it("runs expiry job idempotently and lists notifications", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);

    const r1 = await request(app)
      .post("/api/v1/internal/jobs/expiry/run")
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    const r2 = await request(app)
      .post("/api/v1/internal/jobs/expiry/run")
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(r2.body.data.created).toBeLessThanOrEqual(r1.body.data.created);

    const notes = await request(app).get("/api/v1/notifications").set(sessionRequestHeaders(cookie)).expect(200);
    expect(Array.isArray(notes.body.data)).toBe(true);
  });

  it("audit list requires permission and rejects anonymous", async () => {
    const app = buildApplication().app;
    await request(app).get("/api/v1/audit-events").expect(401);
    const cookie = await loginAsAdmin(app);
    const res = await request(app).get("/api/v1/audit-events").set(sessionRequestHeaders(cookie)).expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

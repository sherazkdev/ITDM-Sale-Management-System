import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";

describe("Prompt #25 — official issuance/return XLSX", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("downloads issuance workbook from persisted movement", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();

    const dept = await request(app)
      .post("/api/v1/departments")
      .set(sessionRequestHeaders(cookie))
      .send({ departmentName: `Dept-${ts}` })
      .expect(201);

    const emp = await request(app)
      .post("/api/v1/employees")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeNumber: `E-${ts}`,
        fullName: "Sample Employee",
        departmentId: dept.body.data.departmentId,
        designation: "IT Officer",
      })
      .expect(201);

    const asset = await request(app)
      .post("/api/v1/assets")
      .set(sessionRequestHeaders(cookie))
      .send({
        assetCode: `AST-${ts}`,
        assetName: "Test Laptop",
        categoryId: (
          await request(app).get("/api/v1/asset-categories?pageSize=1").set(sessionRequestHeaders(cookie))
        ).body.data[0].categoryId,
        currentLocation: "HQ",
      })
      .expect(201);

    const issue = await request(app)
      .post("/api/v1/asset-issuances")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeId: emp.body.data.employeeId,
        receivingDepartment: `Dept-${ts}`,
        referenceNumber: `ISS-${ts}`,
        assets: [{ assetId: asset.body.data.assetId }],
      })
      .expect(201);

    const documentId = issue.body.data.documentId as string;
    const res = await request(app)
      .get(`/api/v1/asset-issuances/${documentId}/official-xlsx`)
      .set(sessionRequestHeaders(cookie))
      .buffer(true)
      .expect(200);

    expect(res.headers["content-type"]).toMatch(/spreadsheet|excel/i);
    expect(res.headers["x-itdms-export-disclaimer"]).toBe("CLIENT-D12-OFFICIAL-TEMPLATE");
    const bodyLen = Buffer.isBuffer(res.body) ? res.body.length : Number(res.headers["content-length"] ?? 0);
    expect(bodyLen).toBeGreaterThan(1000);
  });
});

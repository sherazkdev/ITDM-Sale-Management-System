import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";

describe("Phase 02 reliability — readiness", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("health live returns ok without database work", async () => {
    const app = buildApplication().app;
    const res = await request(app).get("/api/v1/health/live").expect(200);
    expect(res.body.data.status).toBe("ok");
  });

  it("health ready returns database up when connected", async () => {
    const app = buildApplication().app;
    const res = await request(app).get("/api/v1/health/ready").expect(200);
    expect(res.body.data.checks.database).toBe("up");
  });

  it("duplicate asset return is rejected", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();

    const employee = await request(app)
      .post("/api/v1/employees")
      .set(sessionRequestHeaders(cookie))
      .send({ employeeNumber: `RET-${ts}`, fullName: "Return Test", department: "IT" })
      .expect(201);
    const cat = await request(app)
      .post("/api/v1/asset-categories")
      .set(sessionRequestHeaders(cookie))
      .send({ categoryName: `RET-${ts}` })
      .expect(201);
    const asset = await request(app)
      .post("/api/v1/assets")
      .set(sessionRequestHeaders(cookie))
      .send({
        assetCode: `RET-${ts}`,
        assetName: "Returnable",
        categoryId: cat.body.data.categoryId,
      })
      .expect(201);

    await request(app)
      .post("/api/v1/asset-issuances")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeId: employee.body.data.employeeId,
        assets: [{ assetId: asset.body.data.assetId }],
      })
      .expect(201);

    await request(app)
      .post("/api/v1/asset-returns")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeId: employee.body.data.employeeId,
        assets: [{ assetId: asset.body.data.assetId }],
      })
      .expect(201);

    const dup = await request(app)
      .post("/api/v1/asset-returns")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeId: employee.body.data.employeeId,
        assets: [{ assetId: asset.body.data.assetId }],
      });
    expect([409, 422]).toContain(dup.status);
  });
});

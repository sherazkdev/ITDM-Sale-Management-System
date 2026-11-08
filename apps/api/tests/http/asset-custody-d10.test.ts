import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";

describe("D10 — asset custody department snapshot", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  async function registerAsset(
    app: ReturnType<typeof buildApplication>["app"],
    cookie: string,
    ts: number,
    suffix: string,
  ) {
    const cat = await request(app)
      .post("/api/v1/asset-categories")
      .set(sessionRequestHeaders(cookie))
      .send({ categoryName: `D10-C-${ts}-${suffix}` })
      .expect(201);
    return request(app)
      .post("/api/v1/assets")
      .set(sessionRequestHeaders(cookie))
      .send({
        assetCode: `D10-A-${ts}-${suffix}`,
        assetName: `Device ${suffix}`,
        categoryId: cat.body.data.categoryId,
      })
      .expect(201);
  }

  it("captures department at issuance and preserves after employee transfer", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();

    const emp = await request(app)
      .post("/api/v1/employees")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeNumber: `D10-E-${ts}`,
        fullName: "Ahmed Khan",
        department: "IT",
      })
      .expect(201);
    const employeeId = emp.body.data.employeeId as string;

    const asset1 = await registerAsset(app, cookie, ts, "1");
    const asset2 = await registerAsset(app, cookie, ts, "2");

    const issue1 = await request(app)
      .post("/api/v1/asset-issuances")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeId,
        assets: [{ assetId: asset1.body.data.assetId }],
      })
      .expect(201);
    expect(issue1.body.data.receivingDepartment).toBe("IT");

    await request(app)
      .patch(`/api/v1/employees/${employeeId}`)
      .set(sessionRequestHeaders(cookie))
      .send({ department: "Finance" })
      .expect(200);

    const freshEmp = await request(app)
      .get(`/api/v1/employees/${employeeId}`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(freshEmp.body.data.department).toBe("Finance");

    const history1 = await request(app)
      .get(`/api/v1/assets/${asset1.body.data.assetId}/history`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    const issueRow = history1.body.data.find(
      (r: { transactionType: string }) => r.transactionType === "ISSUE",
    );
    expect(issueRow?.receivingDepartment).toBe("IT");

    const issue2 = await request(app)
      .post("/api/v1/asset-issuances")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeId,
        receivingDepartment: "Finance",
        assets: [{ assetId: asset2.body.data.assetId }],
      })
      .expect(201);
    expect(issue2.body.data.receivingDepartment).toBe("Finance");

    await request(app)
      .post("/api/v1/asset-returns")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeId,
        assets: [{ assetId: asset1.body.data.assetId }],
      })
      .expect(201);

    const historyAfterReturn = await request(app)
      .get(`/api/v1/assets/${asset1.body.data.assetId}/history`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    const issueAfter = historyAfterReturn.body.data.find(
      (r: { transactionType: string }) => r.transactionType === "ISSUE",
    );
    expect(issueAfter?.receivingDepartment).toBe("IT");
  });

  it("allows explicit department when employee profile has none", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now() + 1;
    const emp = await request(app)
      .post("/api/v1/employees")
      .set(sessionRequestHeaders(cookie))
      .send({ employeeNumber: `D10-NO-${ts}`, fullName: "No Dept Yet" })
      .expect(201);
    const asset = await registerAsset(app, cookie, ts, "x");
    const issue = await request(app)
      .post("/api/v1/asset-issuances")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeId: emp.body.data.employeeId,
        receivingDepartment: "Network Ops",
        assets: [{ assetId: asset.body.data.assetId }],
      })
      .expect(201);
    expect(issue.body.data.receivingDepartment).toBe("Network Ops");
  });

  it("rejects issuance without department information", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now() + 2;
    const emp = await request(app)
      .post("/api/v1/employees")
      .set(sessionRequestHeaders(cookie))
      .send({ employeeNumber: `D10-ND-${ts}`, fullName: "Missing Dept" })
      .expect(201);
    const asset = await registerAsset(app, cookie, ts, "y");
    const bad = await request(app)
      .post("/api/v1/asset-issuances")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeId: emp.body.data.employeeId,
        assets: [{ assetId: asset.body.data.assetId }],
      })
      .expect(422);
    expect(bad.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("does not overwrite employee master when issuance department differs", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now() + 3;
    const emp = await request(app)
      .post("/api/v1/employees")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeNumber: `D10-DIFF-${ts}`,
        fullName: "Diff Dept",
        department: "IT",
      })
      .expect(201);
    const employeeId = emp.body.data.employeeId as string;
    const asset = await registerAsset(app, cookie, ts, "z");
    await request(app)
      .post("/api/v1/asset-issuances")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeId,
        receivingDepartment: "Temporary project pool",
        assets: [{ assetId: asset.body.data.assetId }],
      })
      .expect(201);
    const row = await request(app)
      .get(`/api/v1/employees/${employeeId}`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(row.body.data.department).toBe("IT");
  });
});

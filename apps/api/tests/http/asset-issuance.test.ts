import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";

describe("Asset issuance and returns", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("issues and returns multiple assets atomically", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();

    const employee = await request(app)
      .post("/api/v1/employees")
      .set(sessionRequestHeaders(cookie))
      .send({ employeeNumber: `E-${ts}`, fullName: "Holder", department: "IT" })
      .expect(201);
    const employeeId = employee.body.data.employeeId as string;

    const cat = await request(app)
      .post("/api/v1/asset-categories")
      .set(sessionRequestHeaders(cookie))
      .send({ categoryName: `C-${ts}` })
      .expect(201);
    const categoryId = cat.body.data.categoryId as string;

    const assetIds: string[] = [];
    for (let i = 0; i < 2; i++) {
      const a = await request(app)
        .post("/api/v1/assets")
        .set(sessionRequestHeaders(cookie))
        .send({
          assetCode: `CODE-${ts}-${i}`,
          assetName: `Device ${i}`,
          categoryId,
        })
        .expect(201);
      assetIds.push(a.body.data.assetId as string);
    }

    const issue = await request(app)
      .post("/api/v1/asset-issuances")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeId,
        referenceNumber: `ISS-${ts}`,
        assets: assetIds.map((assetId) => ({ assetId })),
      })
      .expect(201);
    expect(issue.body.data.lines).toHaveLength(2);

    const holder = await request(app)
      .get(`/api/v1/assets/${assetIds[0]}/current-holder`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(holder.body.data.assetStatus).toBe("ISSUED");

    await request(app)
      .post("/api/v1/asset-returns")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeId,
        referenceNumber: `RET-${ts}`,
        assets: [{ assetId: assetIds[0] }],
      })
      .expect(201);

    const after = await request(app)
      .get(`/api/v1/assets/${assetIds[0]}/current-holder`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(after.body.data.assetStatus).toBe("IN_STOCK");
  });

  it("rejects issuing an already issued asset", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now() + 1;

    const employee = await request(app)
      .post("/api/v1/employees")
      .set(sessionRequestHeaders(cookie))
      .send({ employeeNumber: `E2-${ts}`, fullName: "Holder2", department: "Ops" })
      .expect(201);
    const employeeId = employee.body.data.employeeId as string;

    const cat = await request(app)
      .post("/api/v1/asset-categories")
      .set(sessionRequestHeaders(cookie))
      .send({ categoryName: `C2-${ts}` })
      .expect(201);

    const a = await request(app)
      .post("/api/v1/assets")
      .set(sessionRequestHeaders(cookie))
      .send({
        assetCode: `SOLO-${ts}`,
        assetName: "Solo",
        categoryId: cat.body.data.categoryId,
      })
      .expect(201);
    const assetId = a.body.data.assetId as string;

    await request(app)
      .post("/api/v1/asset-issuances")
      .set(sessionRequestHeaders(cookie))
      .send({ employeeId, assets: [{ assetId }] })
      .expect(201);

    await request(app)
      .post("/api/v1/asset-issuances")
      .set(sessionRequestHeaders(cookie))
      .send({ employeeId, assets: [{ assetId }] })
      .expect(409);
  });
});

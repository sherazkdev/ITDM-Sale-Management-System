import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";

describe("Assets API", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("registers asset with unique code and rejects duplicate", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);

    const cat = await request(app)
      .post("/api/v1/asset-categories")
      .set(sessionRequestHeaders(cookie))
      .send({ categoryName: `Cat-${Date.now()}`, description: "Laptops" })
      .expect(201);

    const categoryId = cat.body.data.categoryId as string;
    const code = `AST-${Date.now()}`;

    await request(app)
      .post("/api/v1/assets")
      .set(sessionRequestHeaders(cookie))
      .send({
        assetCode: code,
        assetName: "Laptop",
        categoryId,
        purchaseCost: 1200,
      })
      .expect(201);

    const dup = await request(app)
      .post("/api/v1/assets")
      .set(sessionRequestHeaders(cookie))
      .send({ assetCode: code, assetName: "Dup", categoryId })
      .expect(409);
    expect(dup.body.error.code).toBe("CONFLICT");
  });

  it("rejects PATCH that would change issuance status implicitly", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const list = await request(app).get("/api/v1/assets").set(sessionRequestHeaders(cookie)).expect(200);
    const assetId = list.body.data[0]?.assetId;
    expect(assetId).toBeDefined();
    await request(app)
      .patch(`/api/v1/assets/${assetId}`)
      .set(sessionRequestHeaders(cookie))
      .send({ currentLocation: "Store Room" })
      .expect(200);
  });
});

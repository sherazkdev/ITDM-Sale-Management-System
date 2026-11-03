import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";

describe("Vendors API", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("creates, reads, archives, and lists vendors", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);

    const vendorName = `Vendor ${Date.now()}`;
    const create = await request(app)
      .post("/api/v1/vendors")
      .set(sessionRequestHeaders(cookie))
      .send({
        vendorName,
        registrationNumber: "REG-001",
        email: "vendor@example.com",
      })
      .expect(201);

    const vendorId = create.body.data.vendorId as string;
    expect(create.body.data.isActive).toBe(true);

    const get = await request(app)
      .get(`/api/v1/vendors/${vendorId}`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(get.body.data.relationCounts.contracts).toBe(0);

    await request(app)
      .post(`/api/v1/vendors/${vendorId}/archive`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);

    const list = await request(app)
      .get(`/api/v1/vendors?isActive=false&search=${encodeURIComponent(vendorName)}`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(list.body.data.some((v: { vendorId: string }) => v.vendorId === vendorId)).toBe(true);
  });

  it("rejects vendor access without auth", async () => {
    const app = buildApplication().app;
    await request(app).get("/api/v1/vendors").expect(401);
  });
});

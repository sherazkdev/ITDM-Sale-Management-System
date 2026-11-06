import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";
import { createReadOnlySessionCookie } from "../helpers/rbac-test.js";

describe("Dashboard API", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("requires authentication", async () => {
    const app = buildApplication().app;
    const res = await request(app).get("/api/v1/dashboard/summary").expect(401);
    expect(res.body.success).toBe(false);
  });

  it("returns permission-filtered sections for admin", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const res = await request(app)
      .get("/api/v1/dashboard/summary")
      .set(sessionRequestHeaders(cookie))
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.generatedAt).toBe("string");
    expect(Array.isArray(res.body.data.sectionsIncluded)).toBe(true);
    expect(res.body.data.sectionsIncluded).toContain("employees");
    expect(res.body.data.sectionsIncluded).toContain("assets");
    expect(res.body.data.employees).toMatchObject({
      total: expect.any(Number),
      active: expect.any(Number),
      inactive: expect.any(Number),
    });
    expect(res.body.data.assets).toMatchObject({
      registered: expect.any(Number),
      inStock: expect.any(Number),
      issued: expect.any(Number),
    });
    expect(res.body.data.sectionsIncluded).toContain("nonAssetStock");
    expect(res.body.data.nonAssetStock).toMatchObject({
      registeredItemCount: expect.any(Number),
      note: expect.stringContaining("not summed"),
    });
    expect(res.body.data.sectionsIncluded).toContain("expiryWatchlist");
    expect(res.body.data.expiryWatchlist).toMatchObject({
      windowDays: expect.any(Number),
      items: expect.any(Array),
    });
    expect(res.body.data.sectionsIncluded).toContain("budgetOverview");
    expect(res.body.data.budgetOverview).toMatchObject({
      provisional: true,
      usdAllocationCount: expect.any(Number),
      usdAllocatedTotal: expect.any(String),
    });
    expect(res.body.data.budgetOverview.remainingUsd).toBeUndefined();
  });

  it("omits restricted sections for read-only employees user", async () => {
    const app = buildApplication().app;
    const cookie = await createReadOnlySessionCookie();
    const res = await request(app)
      .get("/api/v1/dashboard/summary")
      .set(sessionRequestHeaders(cookie))
      .expect(200);

    expect(res.body.data.sectionsIncluded).toContain("employees");
    expect(res.body.data.employees).toBeDefined();
    expect(res.body.data.assets).toBeUndefined();
    expect(res.body.data.purchaseOrders).toBeUndefined();
    expect(res.body.data.sectionsIncluded).not.toContain("assets");
  });
});

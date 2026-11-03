import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";

describe("Phase 02 security regression (Phase 01 protections)", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("rejects cookie mutation without CSRF header", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const res = await request(app)
      .post("/api/v1/vendors")
      .set("Cookie", cookie)
      .send({ vendorName: `csrf-reg-${Date.now()}` });
    expect(res.status).toBe(403);
  });

  it("does not disable CSRF via NODE_ENV=test alone", async () => {
    expect(process.env.NODE_ENV).toBe("test");
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const res = await request(app)
      .post("/api/v1/employees")
      .set("Cookie", cookie)
      .send({ employeeNumber: `E-${Date.now()}`, fullName: "No CSRF" });
    expect(res.status).toBe(403);
  });

  it("rejects cross-origin vendor create with session cookie", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const res = await request(app)
      .post("/api/v1/vendors")
      .set(sessionRequestHeaders(cookie))
      .set("Origin", "https://attacker.example")
      .send({ vendorName: `evil-${Date.now()}` });
    expect(res.status).toBe(403);
  });

  it("returns rate limit headers on auth login attempts", async () => {
    const app = buildApplication().app;
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "admin", password: "wrong-password-phase02" });
    expect(res.headers["ratelimit-limit"]).toBeDefined();
  });
});

import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import {
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
  isCrossOriginMutation,
} from "../../src/shared/middleware/csrf.middleware.js";
import {
  loginAsAdmin,
  sessionRequestHeaders,
} from "../helpers/auth-test.js";

describe("Security verification gate — CSRF integration", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("rejects authenticated POST without CSRF header", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);

    const denied = await request(app)
      .post("/api/v1/employees")
      .set("Cookie", cookie)
      .send({
        employeeNumber: `CSRF-${Date.now()}`,
        fullName: "Should Fail",
        department: "IT",
      })
      .expect(403);
    expect(denied.body.error.code).toBe("FORBIDDEN");

    const ok = await request(app)
      .post("/api/v1/employees")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeNumber: `CSRF-OK-${Date.now()}`,
        fullName: "CSRF OK",
        department: "IT",
      })
      .expect(201);
    expect(ok.body.success).toBe(true);
  });

  it("rejects cross-origin cookie mutation even with CSRF header", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);

    await request(app)
      .post("/api/v1/employees")
      .set(sessionRequestHeaders(cookie))
      .set("Origin", "https://evil.example.com")
      .send({
        employeeNumber: `ORIGIN-${Date.now()}`,
        fullName: "Evil",
        department: "IT",
      })
      .expect(403);
  });

  it("does not allow Bearer to bypass CSRF when session cookie is present", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);

    await request(app)
      .post("/api/v1/employees")
      .set("Cookie", cookie)
      .set("Authorization", "Bearer not-a-real-session")
      .send({
        employeeNumber: `BYPASS-${Date.now()}`,
        fullName: "Bypass",
        department: "IT",
      })
      .expect(403);
  });

  it("logout invalidates session for subsequent requests", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);

    await request(app)
      .post("/api/v1/auth/logout")
      .set(sessionRequestHeaders(cookie))
      .expect(200);

    await request(app).get("/api/v1/auth/me").set(sessionRequestHeaders(cookie)).expect(401);
  });

  it("isCrossOriginMutation allows same Host Origin", () => {
    const req = {
      header: (name: string) => (name === "Origin" ? "http://127.0.0.1:3000" : "127.0.0.1:3000"),
    } as Parameters<typeof isCrossOriginMutation>[0];
    expect(isCrossOriginMutation(req)).toBe(false);
  });

  it("documents CSRF header contract for browser client", () => {
    expect(CSRF_HEADER_NAME).toBe("x-itdms-requested-with");
    expect(CSRF_HEADER_VALUE).toBe("itdms");
  });
});

describe("Security verification gate — login rate limit headers", () => {
  it("returns rate-limit headers on login route", async () => {
    const app = buildApplication().app;
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "admin.dev", password: "ChangeMe_DevOnly!" });
    expect(res.status).toBe(200);
    expect(res.headers["ratelimit-limit"] ?? res.headers["RateLimit-Limit"]).toBeDefined();
  });
});

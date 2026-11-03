import { describe, expect, it } from "vitest";
import request from "supertest";
import { createTestApp } from "../helpers/create-test-app.js";
import { REQUEST_ID_HEADER } from "../../src/shared/middleware/request-id.js";

describe("HTTP API foundation", () => {
  it("returns 404 with standard error envelope for unknown routes", async () => {
    const app = createTestApp();
    const res = await request(app).get("/api/v1/unknown").expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(typeof res.body.meta.requestId).toBe("string");
    expect(res.headers[REQUEST_ID_HEADER]).toBeDefined();
  });

  it("returns 400 for invalid JSON bodies", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/api/v1/health/live")
      .set("Content-Type", "application/json")
      .send("{ not-json")
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });

  it("GET /api/v1/health/live does not require database", async () => {
    const app = createTestApp();
    const res = await request(app).get("/api/v1/health/live").expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
    expect(res.body.data.service).toBe("itdms-api");
    expect(res.body.meta.requestId).toBeTruthy();
  });

  it("propagates incoming x-request-id when provided", async () => {
    const app = createTestApp();
    const res = await request(app)
      .get("/api/v1/health/live")
      .set(REQUEST_ID_HEADER, "test-req-123")
      .expect(200);

    expect(res.headers[REQUEST_ID_HEADER]).toBe("test-req-123");
    expect(res.body.meta.requestId).toBe("test-req-123");
  });
});

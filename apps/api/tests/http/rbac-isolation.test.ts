import { describe, expect, it, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { sessionRequestHeaders } from "../helpers/auth-test.js";
import { createReadOnlySessionCookie, disconnectRbacTestDb } from "../helpers/rbac-test.js";

describe("RBAC permission isolation", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  afterAll(async () => {
    await disconnectRbacTestDb();
  });

  it("denies employee create for read-only role", async () => {
    const app = buildApplication().app;
    const cookie = await createReadOnlySessionCookie();

    await request(app)
      .get("/api/v1/employees")
      .set(sessionRequestHeaders(cookie))
      .expect(200);

    const denied = await request(app)
      .post("/api/v1/employees")
      .set(sessionRequestHeaders(cookie))
      .send({ employeeNumber: `RO-${Date.now()}`, fullName: "Should Fail" })
      .expect(403);
    expect(denied.body.error.code).toBe("FORBIDDEN");
  });
});

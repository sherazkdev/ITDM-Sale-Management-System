import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";
import { resetEnvCacheForTests } from "../../src/shared/config/env.js";

describe("Notification list filters", () => {
  beforeAll(async () => {
    process.env.NOTIFICATION_LEAD_DAYS = "60";
    await prepareTestDatabase();
    resetEnvCacheForTests();
  }, 120_000);

  it("accepts read=unread and legacy unread=true", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);

    const legacy = await request(app)
      .get("/api/v1/notifications?unread=true&pageSize=5")
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(legacy.body.success).toBe(true);

    const modern = await request(app)
      .get("/api/v1/notifications?read=unread&pageSize=5")
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(modern.body.success).toBe(true);
  });

  it("rejects invalid eventType", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    await request(app)
      .get("/api/v1/notifications?eventType=UNKNOWN")
      .set(sessionRequestHeaders(cookie))
      .expect(400);
  });
});

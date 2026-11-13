import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";

describe("Prompt #25 — expiry milestone notifications", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("creates milestone notification for contract at 30 days", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();

    const vendor = await request(app)
      .post("/api/v1/vendors")
      .set(sessionRequestHeaders(cookie))
      .send({ vendorName: `MilV-${ts}` })
      .expect(201);

    await request(app)
      .post("/api/v1/contracts")
      .set(sessionRequestHeaders(cookie))
      .send({
        contractNumber: `MIL-${ts}`,
        vendorId: vendor.body.data.vendorId,
        startDate: "2026-01-01",
        expiryDate: "2026-07-01",
      })
      .expect(201);

    const asOf = "2026-06-01T12:00:00.000Z";
    const scan = await request(app)
      .post("/api/v1/internal/jobs/expiry/run")
      .set(sessionRequestHeaders(cookie))
      .send({ asOf })
      .expect(200);

    expect(scan.body.data.created).toBeGreaterThanOrEqual(1);

    const notes = await request(app)
      .get("/api/v1/notifications?pageSize=100&eventType=CONTRACT_EXPIRY")
      .set(sessionRequestHeaders(cookie))
      .expect(200);

    const hit = notes.body.data.find(
      (n: { payload?: { contractNumber?: string; daysUntil?: number } }) =>
        n.payload?.contractNumber === `MIL-${ts}` && n.payload?.daysUntil === 30,
    );
    expect(hit).toBeTruthy();
    expect(hit.recipientUserId).toBeTruthy();
  });

  it("duplicate scan is idempotent per milestone and recipient", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const asOf = "2026-06-01T12:00:00.000Z";
    const first = await request(app)
      .post("/api/v1/internal/jobs/expiry/run")
      .set(sessionRequestHeaders(cookie))
      .send({ asOf })
      .expect(200);
    const second = await request(app)
      .post("/api/v1/internal/jobs/expiry/run")
      .set(sessionRequestHeaders(cookie))
      .send({ asOf })
      .expect(200);
    expect(second.body.data.created).toBe(0);
    expect(first.body.data.created).toBeGreaterThanOrEqual(0);
  });
});

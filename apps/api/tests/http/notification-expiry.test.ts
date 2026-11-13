import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";

describe("Expiry notifications — client milestones", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  function utcDateOnly(daysFromBase: number, base = new Date("2026-06-01T12:00:00.000Z")): string {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + daysFromBase);
    return d.toISOString().slice(0, 10);
  }

  it("creates contract notification at milestone inside window and skips outside", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();

    const vendor = await request(app)
      .post("/api/v1/vendors")
      .set(sessionRequestHeaders(cookie))
      .send({ vendorName: `ExpV-${ts}` })
      .expect(201);

    const inside = utcDateOnly(30);
    const outside = utcDateOnly(75);

    await request(app)
      .post("/api/v1/contracts")
      .set(sessionRequestHeaders(cookie))
      .send({
        contractNumber: `C-IN-${ts}`,
        vendorId: vendor.body.data.vendorId,
        startDate: "2026-01-01",
        expiryDate: inside,
      })
      .expect(201);

    await request(app)
      .post("/api/v1/contracts")
      .set(sessionRequestHeaders(cookie))
      .send({
        contractNumber: `C-OUT-${ts}`,
        vendorId: vendor.body.data.vendorId,
        startDate: "2026-01-01",
        expiryDate: outside,
      })
      .expect(201);

    const asOf = "2026-06-01T12:00:00.000Z";
    const scan = await request(app)
      .post("/api/v1/internal/jobs/expiry/run")
      .set(sessionRequestHeaders(cookie))
      .send({ asOf })
      .expect(200);

    expect(scan.body.data.leadDays).toBe(60);
    expect(scan.body.data.created).toBeGreaterThanOrEqual(1);

    const notes = await request(app)
      .get("/api/v1/notifications?pageSize=100&eventType=CONTRACT_EXPIRY")
      .set(sessionRequestHeaders(cookie))
      .expect(200);

    const numbers = notes.body.data.map(
      (n: { payload: { contractNumber?: string } }) => n.payload?.contractNumber,
    );
    expect(numbers).toContain(`C-IN-${ts}`);
    expect(numbers).not.toContain(`C-OUT-${ts}`);
  });

  it("duplicate expiry scan is idempotent", async () => {
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

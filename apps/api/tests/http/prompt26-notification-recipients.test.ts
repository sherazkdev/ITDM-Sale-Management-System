import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";
import { loginAsItStaff, loginAsManager } from "../helpers/role-test-sessions.js";

describe("Prompt #26 — expiry notification recipient isolation", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 180_000);

  it("Super Admin receives contract expiry; Manager and IT Staff do not", async () => {
    const app = buildApplication().app;
    const adminCookie = await loginAsAdmin(app);
    const managerCookie = await loginAsManager();
    const staffCookie = await loginAsItStaff();
    const ts = Date.now();

    const vendor = await request(app)
      .post("/api/v1/vendors")
      .set(sessionRequestHeaders(adminCookie))
      .send({ vendorName: `IsoV-${ts}` })
      .expect(201);

    await request(app)
      .post("/api/v1/contracts")
      .set(sessionRequestHeaders(adminCookie))
      .send({
        contractNumber: `ISO-C-${ts}`,
        vendorId: vendor.body.data.vendorId,
        startDate: "2025-01-01",
        expiryDate: "2026-01-31",
      })
      .expect(201);

    await request(app)
      .post("/api/v1/internal/jobs/expiry/run")
      .set(sessionRequestHeaders(adminCookie))
      .send({ asOf: "2026-01-01T12:00:00.000Z" })
      .expect(200);

    const adminNotes = await request(app)
      .get("/api/v1/notifications?eventType=CONTRACT_EXPIRY&pageSize=50")
      .set(sessionRequestHeaders(adminCookie))
      .expect(200);
    const adminHits = adminNotes.body.data.filter(
      (n: { payload?: { contractNumber?: string } }) => n.payload?.contractNumber === `ISO-C-${ts}`,
    );
    expect(adminHits.length).toBeGreaterThanOrEqual(1);

    const managerNotes = await request(app)
      .get("/api/v1/notifications?eventType=CONTRACT_EXPIRY&pageSize=50")
      .set(sessionRequestHeaders(managerCookie))
      .expect(200);
    const managerHits = managerNotes.body.data.filter(
      (n: { payload?: { contractNumber?: string } }) => n.payload?.contractNumber === `ISO-C-${ts}`,
    );
    expect(managerHits.length).toBe(0);

    const staffNotes = await request(app)
      .get("/api/v1/notifications?eventType=CONTRACT_EXPIRY&pageSize=50")
      .set(sessionRequestHeaders(staffCookie))
      .expect(200);
    const staffHits = staffNotes.body.data.filter(
      (n: { payload?: { contractNumber?: string } }) => n.payload?.contractNumber === `ISO-C-${ts}`,
    );
    expect(staffHits.length).toBe(0);
  });
});

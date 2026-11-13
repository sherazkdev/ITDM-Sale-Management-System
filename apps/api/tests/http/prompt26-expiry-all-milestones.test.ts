import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";
import {
  EXPIRY_REMINDER_DAYS_BEFORE,
  daysUntilExpiryDateOnly,
  startOfUtcDay,
} from "../../src/shared/domain/expiry-reminder-policy.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Prompt #26 — all expiry milestones (60…0)", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("emits one notification per milestone for contract, PO and license", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();
    const asOf = startOfUtcDay(new Date("2026-01-01T00:00:00.000Z"));

    const vendor = await request(app)
      .post("/api/v1/vendors")
      .set(sessionRequestHeaders(cookie))
      .send({ vendorName: `MilVendor-${ts}` })
      .expect(201);

    const vendorId = vendor.body.data.vendorId as string;

    for (const days of EXPIRY_REMINDER_DAYS_BEFORE) {
      const expiry = new Date(asOf);
      expiry.setUTCDate(expiry.getUTCDate() + days);
      const expiryIso = expiry.toISOString().slice(0, 10);

      await request(app)
        .post("/api/v1/contracts")
        .set(sessionRequestHeaders(cookie))
        .send({
          contractNumber: `MIL-C-${days}-${ts}`,
          vendorId,
          startDate: "2025-01-01",
          expiryDate: expiryIso,
        })
        .expect(201);

      await request(app)
        .post("/api/v1/purchase-orders")
        .set(sessionRequestHeaders(cookie))
        .send({
          poNumber: `MIL-PO-${days}-${ts}`,
          vendorId,
          poDate: "2025-06-01",
          currency: "USD",
          validUntil: expiryIso,
        })
        .expect(201);

      await request(app)
        .post("/api/v1/software-licenses")
        .set(sessionRequestHeaders(cookie))
        .send({
          softwareName: `MIL-LIC-${days}-${ts}`,
          startDate: "2025-01-01",
          expiryDate: expiryIso,
          licenseQuantity: 1,
          status: "ACTIVE",
        })
        .expect(201);
    }

    const adminUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        userRoles: { some: { role: { roleKey: "admin" } } },
      },
      select: { userId: true },
    });
    expect(adminUsers.length).toBeGreaterThanOrEqual(1);

    const scan = await request(app)
      .post("/api/v1/internal/jobs/expiry/run")
      .set(sessionRequestHeaders(cookie))
      .send({ asOf: asOf.toISOString() })
      .expect(200);

    const expectedCreates =
      EXPIRY_REMINDER_DAYS_BEFORE.length * 3 * adminUsers.length;
    expect(scan.body.data.created).toBe(expectedCreates);

    for (const days of EXPIRY_REMINDER_DAYS_BEFORE) {
      const expiry = new Date(asOf);
      expiry.setUTCDate(expiry.getUTCDate() + days);
      expect(daysUntilExpiryDateOnly(asOf, expiry)).toBe(days);

      const contractNotes = await prisma.notificationEvent.findMany({
        where: {
          eventType: "CONTRACT_EXPIRY",
          payload: { path: ["daysUntil"], equals: days },
        },
      });
      expect(contractNotes.length).toBeGreaterThanOrEqual(adminUsers.length);

      const poNotes = await prisma.notificationEvent.findMany({
        where: {
          eventType: "PO_VALID_UNTIL",
          payload: { path: ["daysUntil"], equals: days },
        },
      });
      expect(poNotes.length).toBeGreaterThanOrEqual(adminUsers.length);

      const licNotes = await prisma.notificationEvent.findMany({
        where: {
          eventType: "LICENSE_EXPIRY",
          payload: { path: ["daysUntil"], equals: days },
        },
      });
      expect(licNotes.length).toBeGreaterThanOrEqual(adminUsers.length);
    }

    const dup = await request(app)
      .post("/api/v1/internal/jobs/expiry/run")
      .set(sessionRequestHeaders(cookie))
      .send({ asOf: asOf.toISOString() })
      .expect(200);
    expect(dup.body.data.created).toBe(0);
  });
});

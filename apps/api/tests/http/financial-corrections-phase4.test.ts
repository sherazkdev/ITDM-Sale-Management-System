import { describe, expect, it, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";
import {
  createFinanceClerkSessionCookie,
  disconnectFinanceClerkTestDb,
} from "../helpers/finance-clerk-test.js";

describe("Business Phase 4 — admin financial corrections", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  afterAll(async () => {
    await disconnectFinanceClerkTestDb();
  });

  async function seedDraftInvoice(cookie: string) {
    const app = buildApplication().app;
    const ts = Date.now();
    const vendor = await request(app)
      .post("/api/v1/vendors")
      .set(sessionRequestHeaders(cookie))
      .send({ vendorName: `FC-V-${ts}` })
      .expect(201);
    const po = await request(app)
      .post("/api/v1/purchase-orders")
      .set(sessionRequestHeaders(cookie))
      .send({
        poNumber: `FC-PO-${ts}`,
        vendorId: vendor.body.data.vendorId,
        poDate: "2026-04-01",
        currency: "USD",
      })
      .expect(201);
    const invoice = await request(app)
      .post("/api/v1/invoices")
      .set(sessionRequestHeaders(cookie))
      .send({
        invoiceNumber: `FC-INV-${ts}`,
        purchaseOrderId: po.body.data.purchaseOrderId,
        invoiceDate: "2026-04-15",
        invoiceAmount: 1000,
      })
      .expect(201);
    return {
      app,
      invoiceId: invoice.body.data.invoiceId as string,
      poId: po.body.data.purchaseOrderId as string,
    };
  }

  it("admin corrects draft invoice metadata with audit trail", async () => {
    const adminCookie = await loginAsAdmin(buildApplication().app);
    const { app, invoiceId } = await seedDraftInvoice(adminCookie);

    const corrected = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/corrections`)
      .set(sessionRequestHeaders(adminCookie))
      .send({
        correctionReason: "Transposed digits on draft entry",
        invoiceAmount: 1050,
        invoiceNumber: `FC-FIXED-${Date.now()}`,
      })
      .expect(200);
    expect(Number(corrected.body.data.invoiceAmount)).toBe(1050);

    const audit = await request(app)
      .get("/api/v1/audit-events")
      .set(sessionRequestHeaders(adminCookie))
      .query({ targetType: "invoice", pageSize: 20 })
      .expect(200);
    const row = audit.body.data.find(
      (e: { action: string; targetId?: string }) =>
        e.action === "financial.correction" && e.targetId === invoiceId,
    );
    expect(row).toBeTruthy();
    expect(row.metadata.correctionReason).toContain("Transposed");
    expect(row.metadata.before.invoiceAmount).toBe("1000");
    expect(row.metadata.after.invoiceAmount).toBe("1050");
  });

  it("user with users.manage but without financial.corrections is forbidden", async () => {
    const app = buildApplication().app;
    const adminCookie = await loginAsAdmin(app);
    const { invoiceId } = await seedDraftInvoice(adminCookie);

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    const um = await prisma.permission.upsert({
      where: { permissionKey: "users.manage" },
      create: { permissionKey: "users.manage", description: "test" },
      update: {},
    });
    const role = await prisma.role.create({
      data: {
        roleKey: `user_admin_only_${Date.now()}`,
        displayName: "User admin delegate",
        rolePermissions: { create: { permissionId: um.permissionId } },
      },
    });
    const { AuthService } = await import("../../src/modules/auth/auth.service.js");
    const { hashSessionToken, generateSessionToken } = await import(
      "../../src/shared/auth/session-token.js",
    );
    const { loadEnv } = await import("../../src/shared/config/env.js");
    const passwordHash = await AuthService.hashPasswordForStorage("Delegate_Test!123");
    const user = await prisma.user.create({
      data: {
        username: `delegate.${Date.now()}@test.local`,
        displayName: "Delegate",
        passwordHash,
        userRoles: { create: { roleId: role.roleId } },
      },
    });
    const sessionToken = generateSessionToken();
    await prisma.session.create({
      data: {
        userId: user.userId,
        tokenHash: hashSessionToken(sessionToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const delegateCookie = `${loadEnv().SESSION_COOKIE_NAME}=${sessionToken}`;
    await prisma.$disconnect();

    await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/corrections`)
      .set(sessionRequestHeaders(delegateCookie))
      .send({
        correctionReason: "Should fail without financial.corrections",
        invoiceAmount: 50,
      })
      .expect(403);
  });

  it("finance clerk is forbidden from corrections", async () => {
    const adminCookie = await loginAsAdmin(buildApplication().app);
    const clerkCookie = await createFinanceClerkSessionCookie();
    const { app, invoiceId } = await seedDraftInvoice(adminCookie);

    await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/corrections`)
      .set(sessionRequestHeaders(clerkCookie))
      .send({
        correctionReason: "Should fail",
        invoiceAmount: 900,
      })
      .expect(403);

    await request(app)
      .post("/api/v1/budget-ledger/entries")
      .set(sessionRequestHeaders(clerkCookie))
      .send({
        correctionReason: "Should fail",
        budgetId: 1,
        transactionType: "MANUAL",
        amount: 1,
        transactionDate: "2026-04-01",
      })
      .expect(403);
  });

  it("rejects correction without reason", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const { invoiceId } = await seedDraftInvoice(cookie);

    await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/corrections`)
      .set(sessionRequestHeaders(cookie))
      .send({ invoiceAmount: 800 })
      .expect(422);
  });

  it("blocks posted invoice correction", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();
    const { invoiceId, poId } = await seedDraftInvoice(cookie);

    const year = await request(app)
      .post("/api/v1/financial-years")
      .set(sessionRequestHeaders(cookie))
      .send({
        yearName: `FY-FC-${ts}`,
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        status: "OPEN",
      })
      .expect(201);
    const alloc = await request(app)
      .post("/api/v1/budget-allocations")
      .set(sessionRequestHeaders(cookie))
      .send({
        financialYearId: year.body.data.financialYearId,
        budgetCategory: "IT",
        allocatedAmount: 50000,
        currency: "USD",
      })
      .expect(201);

    await request(app)
      .post(`/api/v1/invoices/${invoiceId}/post`)
      .set(sessionRequestHeaders(cookie))
      .send({ budgetId: alloc.body.data.budgetId })
      .expect(200);

    const blocked = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/corrections`)
      .set(sessionRequestHeaders(cookie))
      .send({
        correctionReason: "Attempt posted change",
        invoiceAmount: 50,
      })
      .expect(403);
    expect(blocked.body.error.code).toBe("POLICY_NOT_APPROVED");

    const summary = await request(app)
      .get(`/api/v1/budgets/${alloc.body.data.budgetId}/summary`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(Number(summary.body.data.utilizedUsd)).toBe(1000);
    expect(summary.body.data).toBeDefined();
    expect(poId).toBeTruthy();
  });

  it("admin corrects budget allocation amount without changing utilized", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now() + 1;
    const year = await request(app)
      .post("/api/v1/financial-years")
      .set(sessionRequestHeaders(cookie))
      .send({
        yearName: `FY-ALLOC-${ts}`,
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        status: "OPEN",
      })
      .expect(201);
    const alloc = await request(app)
      .post("/api/v1/budget-allocations")
      .set(sessionRequestHeaders(cookie))
      .send({
        financialYearId: year.body.data.financialYearId,
        budgetCategory: "Network",
        allocatedAmount: 10000,
        currency: "USD",
      })
      .expect(201);
    const budgetId = alloc.body.data.budgetId as string;

    await request(app)
      .patch(`/api/v1/budget-allocations/${budgetId}/corrections`)
      .set(sessionRequestHeaders(cookie))
      .send({
        correctionReason: "FY allocation typo",
        allocatedAmount: 12000,
      })
      .expect(200);

    const summary = await request(app)
      .get(`/api/v1/budgets/${budgetId}/summary`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(Number(summary.body.data.allocatedUsdReporting ?? summary.body.data.allocatedAmount)).toBe(
      12000,
    );
    expect(Number(summary.body.data.utilizedUsd)).toBe(0);
    expect(Number(summary.body.data.remainingUsd)).toBe(12000);
  });
});

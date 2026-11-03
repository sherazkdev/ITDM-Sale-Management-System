import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { HealthRepository } from "../../src/modules/health/health.repository.js";
import { HealthService } from "../../src/modules/health/health.service.js";
import { HealthController } from "../../src/modules/health/health.controller.js";
import { createApp } from "../../src/app.js";
import { createHealthRouter } from "../../src/modules/health/health.routes.js";
import { Router } from "express";
import { loadEnv, resetEnvCacheForTests } from "../../src/shared/config/env.js";
import { createLogger } from "../../src/shared/logging/logger.js";
import { createTestApp } from "../helpers/create-test-app.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { ensureTestDatabase, stopTestDatabase } from "./global-setup-db.js";

describe("database integration", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  afterAll(async () => {
    await stopTestDatabase();
  });

  it("GET /api/v1/health/ready returns 200 when PostgreSQL is reachable", async () => {
    const app = createTestApp();
    const res = await request(app).get("/api/v1/health/ready").expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.checks.database).toBe("up");
  });

  it("GET /api/v1/health/ready returns 503 when database is unavailable", async () => {
    resetEnvCacheForTests();
    const env = loadEnv({
      ...process.env,
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      DATABASE_URL: "postgresql://itdms:itdms_dev_password@127.0.0.1:59999/itdms_dev?schema=public",
    });
    const logger = createLogger(env);
    const badPrisma = new PrismaClient({
      datasources: { db: { url: env.DATABASE_URL } },
    });
    const healthController = new HealthController(
      new HealthService(new HealthRepository(badPrisma)),
    );
    const apiRouter = Router();
    apiRouter.use("/health", createHealthRouter(healthController));
    const app = createApp({ env, logger, apiRouter });

    const res = await request(app).get("/api/v1/health/ready").expect(503);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("SERVICE_UNAVAILABLE");

    await badPrisma.$disconnect();
    resetEnvCacheForTests();
    await ensureTestDatabase();
  });

  it("runInTransaction executes callback inside a prisma transaction", async () => {
    const { getPrisma } = await import("../../src/shared/db/prisma.js");
    const { runInTransaction } = await import("../../src/shared/db/transaction.js");
    const env = loadEnv();
    const logger = createLogger(env);
    const prisma = getPrisma(env, logger);

    const result = await runInTransaction(prisma, async (tx) => {
      const rows = await tx.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
      return rows[0]?.ok;
    });
    expect(result).toBe(1);
  });
});

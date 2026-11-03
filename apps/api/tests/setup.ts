import { beforeAll } from "vitest";
import { resetEnvCacheForTests } from "../src/shared/config/env.js";
import { resetPrismaForTests } from "../src/shared/db/prisma.js";

beforeAll(() => {
  process.env.NODE_ENV = "test";
  process.env.PORT = "3000";
  process.env.LOG_LEVEL = "silent";
  process.env.SESSION_SECRET = "test-session-secret-min-16-chars";
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      "postgresql://itdms:itdms_dev_password@127.0.0.1:5433/itdms_test?schema=public";
  }
  process.env.STORAGE_ROOT = process.env.STORAGE_ROOT ?? "./storage-test";
  resetEnvCacheForTests();
  resetPrismaForTests();
});

import EmbeddedPostgres from "embedded-postgres";
import { resetEnvCacheForTests } from "../../src/shared/config/env.js";
import { disconnectPrisma, resetPrismaForTests } from "../../src/shared/db/prisma.js";

let embedded: EmbeddedPostgres | undefined;

export async function ensureTestDatabase(): Promise<void> {
  if (process.env.ITDMS_TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.ITDMS_TEST_DATABASE_URL;
    resetEnvCacheForTests();
    resetPrismaForTests();
    return;
  }

  if (process.env.DATABASE_URL && process.env.ITDMS_USE_EMBEDDED_PG !== "true") {
    resetEnvCacheForTests();
    resetPrismaForTests();
    return;
  }

  if (!embedded) {
    embedded = new EmbeddedPostgres({
      port: 55432,
      user: "itdms",
      password: "itdms_dev_password",
    });
    await embedded.initialise();
    await embedded.start();
    try {
      await embedded.createDatabase("itdms_dev");
    } catch {
      // Database may already exist from a prior run on the same data directory.
    }
  }

  process.env.DATABASE_URL =
    "postgresql://itdms:itdms_dev_password@127.0.0.1:55432/itdms_dev?schema=public";
  resetEnvCacheForTests();
  resetPrismaForTests();
}

export async function stopTestDatabase(): Promise<void> {
  await disconnectPrisma();
  if (embedded) {
    await embedded.stop();
    embedded = undefined;
  }
}

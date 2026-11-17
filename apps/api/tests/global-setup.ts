import pg from "pg";
import { prepareTestDatabase } from "./helpers/prepare-test-database.js";

export default async function globalSetup() {
  const url = process.env.DATABASE_URL ?? "postgresql://itdms:itdms_dev_password@127.0.0.1:5433/itdms_test?schema=public";
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const client = new pg.Client({ connectionString: url });
    try {
      await client.connect();
      await client.query("SELECT 1");
      await client.end();
      break;
    } catch (err) {
      await client.end().catch(() => undefined);
      const message = err instanceof Error ? err.message : String(err);
      if (!/starting up|P1001|ECONNREFUSED/i.test(message)) {
        throw new Error(`PostgreSQL not ready for API tests: ${message}`);
      }
      await new Promise((r) => setTimeout(r, 1_500));
    }
  }
  if (Date.now() >= deadline) {
    throw new Error("Timed out waiting for PostgreSQL before API Vitest (120s)");
  }
  await prepareTestDatabase();
}
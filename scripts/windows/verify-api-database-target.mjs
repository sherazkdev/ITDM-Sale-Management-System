#!/usr/bin/env node
/**
 * Read-only safety check: confirm DATABASE_URL (API process env) is an allowed E2E target.
 * Does not mutate databases. Exit 1 if URL points at protected names.
 */
const url = process.env.DATABASE_URL ?? "";
const allowed = (process.env.ITDMS_E2E_ALLOWED_DBS ?? "itdms_e2e").split(",").map((s) => s.trim());
const match = url.match(/\/([a-zA-Z0-9_]+)(?:\?|$)/);
const dbName = match?.[1] ?? "";

const protectedNames = ["itdms_dev", "itdms_staging"];
if (!url) {
  console.error(JSON.stringify({ event: "e2e_db_target_missing", hint: "Set DATABASE_URL before starting API for Playwright" }));
  process.exit(1);
}
if (protectedNames.includes(dbName)) {
  console.error(
    JSON.stringify({
      event: "e2e_db_target_refused",
      dbName,
      reason: "write-capable Playwright must not use development or staging databases",
    }),
  );
  process.exit(1);
}
if (!allowed.includes(dbName)) {
  console.error(
    JSON.stringify({
      event: "e2e_db_target_unexpected",
      dbName,
      allowed,
      hint: "Set ITDMS_E2E_ALLOWED_DBS to override (comma-separated) if intentional",
    }),
  );
  process.exit(1);
}

console.log(JSON.stringify({ event: "e2e_db_target_ok", dbName }));

/**
 * Remove disposable business-domain rows from itdms_dev only.
 * Uses ordered DELETE (not TRUNCATE). Preserves users, roles, permissions, sessions.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function assertDevDatabase() {
  const url = process.env.DATABASE_URL ?? "";
  if (!/\/itdms_dev(\?|$)/i.test(url)) {
    throw new Error("Refusing purge: DATABASE_URL must target itdms_dev.");
  }
  if (/\/(itdms_e2e|itdms_staging|itdms_test)(\?|$)/i.test(url)) {
    throw new Error("Refusing purge: blocked database name.");
  }
  if (process.env.PURGE_BUSINESS_DOMAIN_CONFIRM !== "itdms_dev") {
    throw new Error('Set PURGE_BUSINESS_DOMAIN_CONFIRM=itdms_dev to run.');
  }
}

const PURGE_TABLES = [
  "notification_events",
  "document_links",
  "stored_documents",
  "audit_logs",
  "budget_transactions",
  "invoice_payments",
  "invoices",
  "budget_allocations",
  "financial_years",
  "asset_movement_document_lines",
  "asset_transactions",
  "asset_movement_documents",
  "maintenance_records",
  "non_asset_stock_movements",
  "non_asset_stock_items",
  "assets",
  "software_licenses",
  "purchase_order_lines",
  "purchase_orders",
  "contracts",
  "asset_categories",
  "vendors",
  "department_legacy_labels",
  "employees",
  "departments",
  "login_attempts",
] as const;

async function purgeBusinessDomain() {
  await prisma.user.updateMany({ data: { employeeId: null } });
  for (const table of PURGE_TABLES) {
    await prisma.$executeRawUnsafe(`DELETE FROM ${table}`);
  }
  for (const table of ["departments", "employees", "vendors"] as const) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('${table}', '${table === "departments" ? "department_id" : table === "employees" ? "employee_id" : "vendor_id"}'), 1, false)`,
    );
  }
}

async function main() {
  assertDevDatabase();
  const before = await prisma.employee.count();
  await purgeBusinessDomain();
  console.log(
    JSON.stringify({
      event: "itdms_dev_business_purge_complete",
      employeesBefore: before,
      preserved: ["users", "roles", "permissions", "user_roles", "role_permissions", "sessions"],
    }),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

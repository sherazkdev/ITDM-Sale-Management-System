/**
 * Dev-only: remove accumulated test/dummy transactional data and load realistic
 * reference rows (departments, employees, minimal vendors/categories).
 *
 * NEVER targets itdms_staging / itdms_test / itdms_e2e unless REFRESH_DATA_ALLOW=1.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALLOWED_DB = /\/(itdms_dev)(\?|$)/i;
const BLOCKED_DB = /\/(itdms_staging|itdms_test|itdms_e2e)(\?|$)/i;

function assertSafeDatabase() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  if (BLOCKED_DB.test(url) && process.env.REFRESH_DATA_ALLOW !== "1") {
    throw new Error("Refusing to refresh a non-dev database. Set REFRESH_DATA_ALLOW=1 to override.");
  }
  if (!ALLOWED_DB.test(url) && process.env.REFRESH_DATA_ALLOW !== "1") {
    throw new Error(
      "Refusing: DATABASE_URL must point at itdms_dev (or set REFRESH_DATA_ALLOW=1 explicitly).",
    );
  }
}

const DEPARTMENTS = [
  { code: "IT-OPS", name: "IT Operations", description: "Core IT services and governance" },
  { code: "IT-INF", name: "Infrastructure", description: "Servers, network, and data centre" },
  { code: "IT-SD", name: "Service Desk", description: "End-user support and incidents" },
  { code: "IT-AST", name: "Asset & Procurement", description: "Hardware lifecycle and vendor coordination" },
] as const;

const EMPLOYEES: Array<{
  employeeNumber: string;
  fullName: string;
  deptCode: string;
  designation: string;
  contactNumber: string;
  email: string;
}> = [
  {
    employeeNumber: "EMP-0001",
    fullName: "Ahmad Hassan",
    deptCode: "IT-OPS",
    designation: "IT Director",
    contactNumber: "+92-300-1000001",
    email: "ahmad.hassan@itdms.local",
  },
  {
    employeeNumber: "EMP-0002",
    fullName: "Sara Khan",
    deptCode: "IT-INF",
    designation: "Infrastructure Manager",
    contactNumber: "+92-300-1000002",
    email: "sara.khan@itdms.local",
  },
  {
    employeeNumber: "EMP-0003",
    fullName: "Usman Ali",
    deptCode: "IT-INF",
    designation: "Systems Engineer",
    contactNumber: "+92-300-1000003",
    email: "usman.ali@itdms.local",
  },
  {
    employeeNumber: "EMP-0004",
    fullName: "Fatima Raza",
    deptCode: "IT-SD",
    designation: "Service Desk Lead",
    contactNumber: "+92-300-1000004",
    email: "fatima.raza@itdms.local",
  },
  {
    employeeNumber: "EMP-0005",
    fullName: "Bilal Ahmed",
    deptCode: "IT-SD",
    designation: "Support Analyst",
    contactNumber: "+92-300-1000005",
    email: "bilal.ahmed@itdms.local",
  },
  {
    employeeNumber: "EMP-0006",
    fullName: "Hina Malik",
    deptCode: "IT-AST",
    designation: "Asset Coordinator",
    contactNumber: "+92-300-1000006",
    email: "hina.malik@itdms.local",
  },
  {
    employeeNumber: "EMP-0007",
    fullName: "Omar Siddiqui",
    deptCode: "IT-AST",
    designation: "Procurement Officer",
    contactNumber: "+92-300-1000007",
    email: "omar.siddiqui@itdms.local",
  },
  {
    employeeNumber: "EMP-0008",
    fullName: "Ayesha Noor",
    deptCode: "IT-OPS",
    designation: "IT Governance Officer",
    contactNumber: "+92-300-1000008",
    email: "ayesha.noor@itdms.local",
  },
];

const VENDORS = [
  { vendorName: "TechSupply Solutions", contactPerson: "Kamran Iqbal", email: "sales@techsupply.example" },
  { vendorName: "National Systems Distributor", contactPerson: "Rabia Shah", email: "orders@nsd.example" },
];

const ASSET_CATEGORIES = [
  { categoryName: "Laptops", description: "Portable computers" },
  { categoryName: "Monitors", description: "Displays and docking" },
  { categoryName: "Network Equipment", description: "Switches, access points, firewalls" },
];

async function purgeTransactionalData() {
  await prisma.user.updateMany({ data: { employeeId: null } });
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      notification_events,
      document_links,
      stored_documents,
      audit_logs,
      budget_transactions,
      budget_allocations,
      financial_years,
      invoice_payments,
      invoices,
      purchase_order_lines,
      purchase_orders,
      contracts,
      software_licenses,
      maintenance_records,
      asset_transactions,
      asset_movement_document_lines,
      asset_movement_documents,
      non_asset_stock_movements,
      non_asset_stock_items,
      assets,
      asset_categories,
      vendors,
      department_legacy_labels,
      employees,
      departments
    RESTART IDENTITY CASCADE;
  `);
  await prisma.loginAttempt.deleteMany();
}

async function seedReferenceData() {
  const deptByCode = new Map<string, bigint>();
  for (const d of DEPARTMENTS) {
    const row = await prisma.department.create({
      data: {
        departmentCode: d.code,
        departmentName: d.name,
        description: d.description,
        isActive: true,
      },
    });
    deptByCode.set(d.code, row.departmentId);
  }

  for (const e of EMPLOYEES) {
    const departmentId = deptByCode.get(e.deptCode);
    const department = DEPARTMENTS.find((d) => d.code === e.deptCode)?.name ?? e.deptCode;
    await prisma.employee.create({
      data: {
        employeeNumber: e.employeeNumber,
        fullName: e.fullName,
        department,
        departmentId,
        designation: e.designation,
        contactNumber: e.contactNumber,
        email: e.email,
        isActive: true,
      },
    });
  }

  for (const v of VENDORS) {
    await prisma.vendor.create({
      data: {
        vendorName: v.vendorName,
        contactPerson: v.contactPerson,
        email: v.email,
        isActive: true,
      },
    });
  }

  for (const c of ASSET_CATEGORIES) {
    await prisma.assetCategory.create({
      data: { categoryName: c.categoryName, description: c.description },
    });
  }

  await prisma.user.updateMany({
    where: { username: process.env.SEED_ADMIN_USERNAME ?? "admin.dev" },
    data: { displayName: "IT Administrator" },
  });
}

async function main() {
  assertSafeDatabase();
  await purgeTransactionalData();
  await seedReferenceData();
  const counts = {
    departments: await prisma.department.count(),
    employees: await prisma.employee.count(),
    vendors: await prisma.vendor.count(),
    categories: await prisma.assetCategory.count(),
    notifications: await prisma.notificationEvent.count(),
  };
  console.log(JSON.stringify({ event: "dev_sample_data_refreshed", counts }, null, 2));
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

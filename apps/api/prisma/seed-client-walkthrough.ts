/**
 * Build a small connected client walkthrough dataset via live API on itdms_dev.
 * Requires API on ITDMS_API_URL (default http://127.0.0.1:3000) and empty business domain.
 */
import { PrismaClient } from "@prisma/client";

const BASE = process.env.ITDMS_API_URL ?? "http://127.0.0.1:3000";
const CSRF = { "x-itdms-requested-with": "itdms" };

function assertDevDatabase() {
  const url = process.env.DATABASE_URL ?? "";
  if (!/\/itdms_dev(\?|$)/i.test(url)) {
    throw new Error("DATABASE_URL must be itdms_dev.");
  }
}

async function login(): Promise<string> {
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe_DevOnly!";
  const res = await fetch(`${BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...CSRF },
    body: JSON.stringify({ username: "admin.dev", password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const raw = res.headers.get("set-cookie") ?? "";
  const pair = raw.split(";")[0]?.trim();
  if (!pair) throw new Error("No session cookie");
  return pair;
}

async function api<T>(
  cookie: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      ...CSRF,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json()) as { success?: boolean; data?: T; message?: string };
  if (!res.ok || json.success === false) {
    throw new Error(`${method} ${path} failed (${res.status}): ${json.message ?? JSON.stringify(json)}`);
  }
  return json.data as T;
}

async function main() {
  assertDevDatabase();
  const prisma = new PrismaClient();
  const cookie = await login();

  const deptOps = await api<{ departmentId: string }>(cookie, "POST", "/departments", {
    departmentName: "IT Operations",
    departmentCode: "IT-OPS",
    description: "Corporate IT service delivery",
  });
  const deptInfra = await api<{ departmentId: string }>(cookie, "POST", "/departments", {
    departmentName: "IT Infrastructure",
    departmentCode: "IT-INF",
    description: "Servers, network and endpoints",
  });

  const empAhmad = await api<{ employeeId: string }>(cookie, "POST", "/employees", {
    employeeNumber: "EMP-1001",
    fullName: "Ahmad Hassan",
    departmentId: deptOps.departmentId,
    designation: "IT Director",
    email: "ahmad.hassan@demo.local",
    contactNumber: "+92-300-555-0101",
  });
  const empSara = await api<{ employeeId: string }>(cookie, "POST", "/employees", {
    employeeNumber: "EMP-1002",
    fullName: "Sara Khan",
    departmentId: deptInfra.departmentId,
    designation: "Infrastructure Lead",
    email: "sara.khan@demo.local",
  });
  const empBilal = await api<{ employeeId: string }>(cookie, "POST", "/employees", {
    employeeNumber: "EMP-1003",
    fullName: "Bilal Ahmed",
    departmentId: deptOps.departmentId,
    designation: "Support Analyst",
    email: "bilal.ahmed@demo.local",
  });

  const vendorDell = await api<{ vendorId: string }>(cookie, "POST", "/vendors", {
    vendorName: "Dell Technologies Partner",
    contactPerson: "Kamran Iqbal",
    email: "procurement@dell-partner.demo",
    phone: "+92-21-555-2000",
  });
  const vendorMs = await api<{ vendorId: string }>(cookie, "POST", "/vendors", {
    vendorName: "Microsoft Licensing Partner",
    contactPerson: "Rabia Shah",
    email: "licensing@ms-partner.demo",
  });

  const catLaptop = await api<{ categoryId: string }>(cookie, "POST", "/asset-categories", {
    categoryName: "Laptops",
    description: "Corporate laptops",
  });

  const fy = await api<{ financialYearId: string }>(cookie, "POST", "/financial-years", {
    yearName: "FY 2026",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    status: "OPEN",
  });
  const budget = await api<{ budgetId: string }>(cookie, "POST", "/budget-allocations", {
    financialYearId: fy.financialYearId,
    budgetCategory: "IT Hardware",
    allocatedAmount: 50000,
    currency: "USD",
  });

  const contractDell = await api<{ contractId: string }>(cookie, "POST", "/contracts", {
    contractNumber: "DEMO-CTR-2026-DELL",
    vendorId: vendorDell.vendorId,
    startDate: "2026-01-01",
    expiryDate: "2026-12-15",
    contractValue: 25000,
    renewalStatus: "Renewal due",
  });
  await api(cookie, "POST", "/contracts", {
    contractNumber: "DEMO-CTR-2026-MS",
    vendorId: vendorMs.vendorId,
    startDate: "2026-01-01",
    expiryDate: "2027-06-30",
    contractValue: 12000,
    renewalStatus: "Active",
  });

  const poLaptops = await api<{ purchaseOrderId: string }>(cookie, "POST", "/purchase-orders", {
    poNumber: "DEMO-PO-2026-001",
    vendorId: vendorDell.vendorId,
    contractId: contractDell.contractId,
    poDate: "2026-02-10",
    currency: "USD",
    validUntil: "2026-12-31",
  });
  await api(cookie, "POST", `/purchase-orders/${poLaptops.purchaseOrderId}/lines`, {
    lineNumber: 1,
    description: "Dell Latitude 5540 — standard issue laptop",
    lineType: "HARDWARE",
    quantity: 3,
    unitPrice: 1200,
  });

  const poAccess = await api<{ purchaseOrderId: string }>(cookie, "POST", "/purchase-orders", {
    poNumber: "DEMO-PO-2026-002",
    vendorId: vendorDell.vendorId,
    poDate: "2026-03-01",
    currency: "USD",
    validUntil: "2026-09-30",
  });
  await api(cookie, "POST", `/purchase-orders/${poAccess.purchaseOrderId}/lines`, {
    lineNumber: 1,
    description: "Docking stations and peripherals kit",
    lineType: "ACCESSORY",
    quantity: 2,
    unitPrice: 185,
  });

  const invoice1 = await api<{ invoiceId: string }>(cookie, "POST", "/invoices", {
    invoiceNumber: "DEMO-INV-2026-001",
    purchaseOrderId: poLaptops.purchaseOrderId,
    invoiceDate: "2026-02-20",
    invoiceAmount: 3600,
  });
  await api(cookie, "POST", `/invoices/${invoice1.invoiceId}/post`, {
    budgetId: budget.budgetId,
  });
  await api(cookie, "POST", `/invoices/${invoice1.invoiceId}/payments`, {
    amount: 3600,
    idempotencyKey: `demo-pay-${invoice1.invoiceId}`,
    referenceNumber: "TRF-DEMO-001",
    budgetId: budget.budgetId,
  });

  await api(cookie, "POST", "/invoices", {
    invoiceNumber: "DEMO-INV-2026-002",
    purchaseOrderId: poAccess.purchaseOrderId,
    invoiceDate: "2026-03-15",
    invoiceAmount: 370,
  });

  const lap1 = await api<{ assetId: string }>(cookie, "POST", "/assets", {
    assetCode: "IT-LAP-001",
    assetName: "Dell Latitude 5540",
    categoryId: catLaptop.categoryId,
    purchaseOrderId: poLaptops.purchaseOrderId,
    purchaseDate: "2026-02-25",
    purchaseCost: 1200,
    currentLocation: "IT Store — Rack A",
  });
  const lap2 = await api<{ assetId: string }>(cookie, "POST", "/assets", {
    assetCode: "IT-LAP-002",
    assetName: "Dell Latitude 5540",
    categoryId: catLaptop.categoryId,
    purchaseOrderId: poLaptops.purchaseOrderId,
    purchaseDate: "2026-02-25",
    purchaseCost: 1200,
    currentLocation: "IT Store — Rack A",
  });
  await api(cookie, "POST", "/assets", {
    assetCode: "IT-LAP-003",
    assetName: "Dell Latitude 5540",
    categoryId: catLaptop.categoryId,
    purchaseOrderId: poLaptops.purchaseOrderId,
    purchaseDate: "2026-02-25",
    purchaseCost: 1200,
    currentLocation: "IT Store — Rack A",
  });

  await api(cookie, "POST", "/asset-issuances", {
    employeeId: empAhmad.employeeId,
    referenceNumber: "ISS-DEMO-001",
    occurredAt: "2026-02-26T10:00:00.000Z",
    assets: [{ assetId: lap1.assetId, conditionNotes: "Issued new — Ahmad director laptop" }],
  });
  await api(cookie, "POST", "/asset-issuances", {
    employeeId: empSara.employeeId,
    referenceNumber: "ISS-DEMO-002",
    occurredAt: "2026-03-02T09:30:00.000Z",
    assets: [{ assetId: lap2.assetId }],
  });
  await api(cookie, "POST", "/asset-returns", {
    employeeId: empSara.employeeId,
    referenceNumber: "RET-DEMO-001",
    occurredAt: "2026-03-10T16:00:00.000Z",
    assets: [{ assetId: lap2.assetId, conditionNotes: "Returned for redeployment" }],
  });

  const licenseMs = await api<{ licenseId: string }>(cookie, "POST", "/software-licenses", {
    softwareName: "Microsoft 365 E3",
    vendorId: vendorMs.vendorId,
    startDate: "2026-01-01",
    expiryDate: "2026-11-30",
    licenseQuantity: 50,
    renewalCost: 4500,
    licenseKeyReference: "VAULT-MS365-DEMO",
    status: "ACTIVE",
  });

  await api(cookie, "POST", "/maintenance-records", {
    assetId: lap1.assetId,
    vendorId: vendorDell.vendorId,
    maintenanceType: "Warranty check",
    requestDate: "2026-03-05",
    cost: 0,
    remarks: "Annual hardware health check",
  });

  await prisma.notificationEvent.createMany({
    data: [
      {
        eventType: "CONTRACT_EXPIRY",
        entityType: "contract",
        entityId: contractDell.contractId,
        dueOn: new Date("2026-12-15T00:00:00.000Z"),
        dedupeKey: `demo-walkthrough-contract-${contractDell.contractId}`,
        payload: {
          title: "Contract DEMO-CTR-2026-DELL approaching expiry",
          contractNumber: "DEMO-CTR-2026-DELL",
        },
      },
      {
        eventType: "LICENSE_EXPIRY",
        entityType: "software_license",
        entityId: String(licenseMs.licenseId),
        dueOn: new Date("2026-11-30T00:00:00.000Z"),
        dedupeKey: "demo-walkthrough-license-ms365",
        payload: {
          title: "Microsoft 365 E3 renewal due",
          softwareName: "Microsoft 365 E3",
        },
      },
    ],
  });

  const counts = {
    departments: await prisma.department.count(),
    employees: await prisma.employee.count(),
    vendors: await prisma.vendor.count(),
    contracts: await prisma.contract.count(),
    purchase_orders: await prisma.purchaseOrder.count(),
    purchase_order_lines: await prisma.purchaseOrderLine.count(),
    invoices: await prisma.invoice.count(),
    assets: await prisma.asset.count(),
    asset_transactions: await prisma.assetTransaction.count(),
    software_licenses: await prisma.softwareLicense.count(),
    maintenance_records: await prisma.maintenanceRecord.count(),
    financial_years: await prisma.financialYear.count(),
    budget_allocations: await prisma.budgetAllocation.count(),
    notification_events: await prisma.notificationEvent.count(),
  };

  console.log(JSON.stringify({ event: "client_walkthrough_seeded", counts }, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

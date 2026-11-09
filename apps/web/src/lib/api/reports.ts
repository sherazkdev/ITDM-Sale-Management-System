import { apiFetchBinary, apiGet, saveBlobAsFile } from "./client";
import { toQueryString } from "./query-string";

export type ReportSlug =
  | "asset-register"
  | "inventory"
  | "budget-utilization"
  | "purchase-orders"
  | "contracts"
  | "invoices"
  | "asset-movements"
  | "employees"
  | "non-asset-stock-ledger"
  | "maintenance"
  | "software-licenses"
  | "document-metadata"
  | "audit-logs";

export type ReportFormat = "json" | "csv" | "pdf" | "xlsx";

export const REPORT_DEFINITIONS: Array<{
  slug: ReportSlug;
  title: string;
  description: string;
  inventoryAlias?: boolean;
}> = [
  {
    slug: "asset-register",
    title: "Asset register",
    description: "Serialized physical assets and key attributes.",
    inventoryAlias: true,
  },
  {
    slug: "inventory",
    title: "Inventory (assets + non-asset stock)",
    description: "Combined export of serialized assets and quantity-based non-asset items.",
    inventoryAlias: true,
  },
  {
    slug: "budget-utilization",
    title: "Budget utilization",
    description: "Provisional ledger utilization by allocation (D06–D08 semantics).",
  },
  {
    slug: "purchase-orders",
    title: "Purchase orders",
    description:
      "PO header register (poNumber, vendor, status, totalAmount, currency, validUntil). Line-level export is not included — R15 report lines remain out of scope pending client requirement.",
  },
  {
    slug: "contracts",
    title: "Contracts",
    description: "Contract register with expiry dates.",
  },
  {
    slug: "invoices",
    title: "Invoices / expenditure",
    description:
      "Invoice amounts, post/commitment USD (Wave 2), actual paid USD, and outstanding balance.",
  },
  {
    slug: "asset-movements",
    title: "Asset issuance & returns",
    description: "Operational movement document lines (official forms pending D12).",
  },
  {
    slug: "employees",
    title: "Employee register",
    description: "Employee master data for HR/IT assignment reporting (R02).",
  },
  {
    slug: "non-asset-stock-ledger",
    title: "Non-asset stock ledger (D09)",
    description: "Movement history with units, recipients, and quantity before/after per transaction.",
    inventoryAlias: true,
  },
  {
    slug: "maintenance",
    title: "Maintenance register",
    description: "Maintenance requests and status (operational export).",
  },
  {
    slug: "software-licenses",
    title: "Software licenses",
    description: "License inventory and expiry (secrets excluded).",
  },
  {
    slug: "document-metadata",
    title: "Document metadata",
    description: "File metadata and owner links only — no file contents.",
  },
  {
    slug: "audit-logs",
    title: "Audit log",
    description: "Administrative audit events with redacted metadata.",
  },
];

export function buildReportQuery(
  format: ReportFormat,
  options?: { financialYearId?: string },
): string {
  return toQueryString({
    format,
    ...(options?.financialYearId ? { financialYearId: options.financialYearId } : {}),
  });
}

export async function fetchReportJson(slug: ReportSlug, financialYearId?: string) {
  const qs = buildReportQuery("json", { financialYearId });
  return apiGet<unknown>(`/reports/${slug}${qs}`);
}

export async function downloadReportExport(
  slug: ReportSlug,
  format: Exclude<ReportFormat, "json">,
  financialYearId?: string,
): Promise<{ disclaimer: string | null }> {
  const qs = buildReportQuery(format, { financialYearId });
  const { blob, headers } = await apiFetchBinary(`/reports/${slug}${qs}`);
  const disclaimer = headers.get("X-ITDMS-Export-Disclaimer");
  const ext = format === "xlsx" ? "xlsx" : format;
  saveBlobAsFile(blob, `itdms-${slug}.${ext}`);
  return { disclaimer };
}

import type { ReportSlug } from "@/lib/api/reports";
import type { PermissionKeys } from "@/lib/permissions";

/** Report-backed list exports (import not supported). */
export type ListReportExportKey =
  | "serialized-assets"
  | "inventory-combined"
  | "purchase-orders"
  | "contracts"
  | "invoices"
  | "budget-utilization"
  | "asset-movements"
  | "non-asset-ledger"
  | "maintenance"
  | "software-licenses"
  | "document-metadata"
  | "audit-logs";

export const LIST_REPORT_EXPORT: Record<
  ListReportExportKey,
  {
    label: string;
    reportSlug: ReportSlug;
    filterKeys?: string[];
    exportPermission?: keyof typeof PermissionKeys;
  }
> = {
  "serialized-assets": { label: "Serialized assets", reportSlug: "asset-register" },
  "inventory-combined": { label: "Inventory", reportSlug: "inventory" },
  "purchase-orders": { label: "Purchase orders", reportSlug: "purchase-orders", filterKeys: ["status"] },
  "contracts": { label: "Contracts", reportSlug: "contracts" },
  invoices: { label: "Invoices", reportSlug: "invoices", filterKeys: ["search", "paymentStatus"] },
  "budget-utilization": {
    label: "Budget utilization",
    reportSlug: "budget-utilization",
    filterKeys: ["financialYearId"],
  },
  "asset-movements": { label: "Asset movements", reportSlug: "asset-movements" },
  "non-asset-ledger": { label: "Non-asset ledger", reportSlug: "non-asset-stock-ledger" },
  maintenance: { label: "Maintenance", reportSlug: "maintenance", filterKeys: ["status", "assetId"] },
  "software-licenses": {
    label: "Software licenses",
    reportSlug: "software-licenses",
    filterKeys: ["before"],
  },
  "document-metadata": {
    label: "Document metadata",
    reportSlug: "document-metadata",
    exportPermission: "documentsRead",
  },
  "audit-logs": {
    label: "Audit log",
    reportSlug: "audit-logs",
    filterKeys: ["targetType"],
    exportPermission: "auditRead",
  },
};

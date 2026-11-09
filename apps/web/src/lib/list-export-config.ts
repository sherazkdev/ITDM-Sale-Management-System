import type { ReportSlug } from "@/lib/api/reports";

/** Report-backed list exports (import not supported). */
export type ListReportExportKey =
  | "serialized-assets"
  | "inventory-combined"
  | "purchase-orders"
  | "contracts"
  | "invoices"
  | "budget-utilization"
  | "asset-movements"
  | "non-asset-ledger";

export const LIST_REPORT_EXPORT: Record<
  ListReportExportKey,
  { label: string; reportSlug: ReportSlug; filterKeys?: string[] }
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
};

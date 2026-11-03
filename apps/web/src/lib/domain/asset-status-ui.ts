import type { StatusKind } from "@/components/common/StatusPill";

export const ASSET_STATUS_LABELS: Record<string, string> = {
  IN_STOCK: "In stock",
  ISSUED: "Issued",
  UNDER_MAINTENANCE: "Under maintenance",
  RETIRED: "Retired",
};

export function assetStatusToPill(status: string): StatusKind {
  switch (status) {
    case "IN_STOCK":
      return "active";
    case "ISSUED":
      return "in_progress";
    case "UNDER_MAINTENANCE":
      return "pending";
    case "RETIRED":
      return "inactive";
    default:
      return "draft";
  }
}

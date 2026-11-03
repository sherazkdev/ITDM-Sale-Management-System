import type { StatusKind } from "@/components/common/StatusPill";

export const MAINTENANCE_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function maintenanceStatusToPill(status: string): StatusKind {
  switch (status) {
    case "COMPLETED":
      return "active";
    case "IN_PROGRESS":
      return "pending";
    case "CANCELLED":
      return "inactive";
    case "OPEN":
    default:
      return "draft";
  }
}

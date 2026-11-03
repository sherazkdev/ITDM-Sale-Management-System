export const MaintenanceStatus = {
  open: "OPEN",
  inProgress: "IN_PROGRESS",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
} as const;

export type MaintenanceStatusValue = (typeof MaintenanceStatus)[keyof typeof MaintenanceStatus];

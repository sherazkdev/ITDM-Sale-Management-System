import { apiGet } from "./client";

export type DashboardEmployeesSection = {
  total: number;
  active: number;
  inactive: number;
};

export type DashboardAssetsSection = {
  registered: number;
  inStock: number;
  issued: number;
  underMaintenance: number;
  retired: number;
};

export type DashboardContractsSection = {
  active: number;
  expiringWithinDays: number;
  expiringCount: number;
};

export type DashboardPurchaseOrdersSection = {
  byStatus: Record<string, number>;
  total: number;
};

export type DashboardLicensesSection = {
  active: number;
  expiringWithinDays: number;
  expiringCount: number;
};

export type DashboardMaintenanceSection = {
  open: number;
  inProgress: number;
  completed: number;
  cancelled: number;
};

export type DashboardNotificationsSection = {
  unread: number;
};

export type DashboardRecentActivityItem = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  occurredAt: string;
  actorDisplayName: string | null;
  result: string;
};

export type DashboardSummary = {
  generatedAt: string;
  sectionsIncluded: string[];
  employees?: DashboardEmployeesSection;
  assets?: DashboardAssetsSection;
  contracts?: DashboardContractsSection;
  purchaseOrders?: DashboardPurchaseOrdersSection;
  licenses?: DashboardLicensesSection;
  maintenance?: DashboardMaintenanceSection;
  notifications?: DashboardNotificationsSection;
  recentActivity?: DashboardRecentActivityItem[];
  budgetNotice?: string;
};

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiGet<DashboardSummary>("/dashboard/summary");
}

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

export type DashboardNonAssetStockSection = {
  registeredItemCount: number;
  note: string;
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

export type DashboardMovementsSection = {
  issuanceDocuments: number;
  returnDocuments: number;
};

export type DashboardExpiryWatchlistItem = {
  kind: "contract" | "software_license";
  id: string;
  label: string;
  expiryDate: string;
  daysRemaining: number;
};

export type DashboardExpiryWatchlistSection = {
  windowDays: number;
  items: DashboardExpiryWatchlistItem[];
};

export type DashboardBudgetOverviewSection = {
  provisional: boolean;
  usdAllocationCount: number;
  usdAllocatedTotal: string;
  utilizedUsdTotal: string;
  actualUsdTotal: string;
  remainingUsdTotal: string | null;
  committedInvoiceLedgerLines: number;
  actualPaymentLedgerLines: number;
  semanticsNote: string;
  provisionalNote: string | null;
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
  nonAssetStock?: DashboardNonAssetStockSection;
  contracts?: DashboardContractsSection;
  purchaseOrders?: DashboardPurchaseOrdersSection;
  licenses?: DashboardLicensesSection;
  maintenance?: DashboardMaintenanceSection;
  notifications?: DashboardNotificationsSection;
  movements?: DashboardMovementsSection;
  expiryWatchlist?: DashboardExpiryWatchlistSection;
  recentActivity?: DashboardRecentActivityItem[];
  budgetNotice?: string;
  budgetOverview?: DashboardBudgetOverviewSection;
};

export type DashboardSummaryParams = {
  from?: string;
  to?: string;
  departmentId?: string;
  financialYearId?: string;
  poStatus?: string;
  assetCategoryId?: string;
  assetStatus?: string;
};

export async function fetchDashboardSummary(params?: DashboardSummaryParams): Promise<DashboardSummary> {
  const entries = Object.entries(params ?? {}).filter(([, v]) => v) as Array<[string, string]>;
  const qs = entries.length ? `?${new URLSearchParams(entries).toString()}` : "";
  return apiGet<DashboardSummary>(`/dashboard/summary${qs}`);
}

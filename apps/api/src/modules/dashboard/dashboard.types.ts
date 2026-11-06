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

/** Item counts only — never sum quantities across mixed units of measure. */
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

/**
 * Provisional finance strip — allocation totals and ledger line counts only.
 * Does not expose remainingUsd as an approved client formula.
 */
export type DashboardBudgetOverviewSection = {
  provisional: true;
  usdAllocationCount: number;
  usdAllocatedTotal: string;
  committedInvoiceLedgerLines: number;
  actualPaymentLedgerLines: number;
  semanticsNote: string;
  provisionalNote: string;
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
  /** @deprecated Prefer budgetOverview; retained for older clients. */
  budgetNotice?: string;
  budgetOverview?: DashboardBudgetOverviewSection;
};

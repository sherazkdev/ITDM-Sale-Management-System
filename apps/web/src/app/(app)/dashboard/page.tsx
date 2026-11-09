"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowRight,
  Bell,
  FileText,
  KeyRound,
  LayoutDashboard,
  Monitor,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  Users,
  Wrench,
} from "lucide-react";

import { KpiCard } from "@/components/common/KpiCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/avatar";
import { CHART, HorizontalBarList, StatusDonut } from "@/components/dashboard/DashboardCharts";
import { DashboardHero } from "@/components/premium/DashboardHero";
import {
  DashboardFilterBar,
  filterRecentActivityByRange,
  useDashboardDateRange,
  useDashboardFilterParams,
} from "@/components/dashboard/DashboardFilterBar";
import { fetchDashboardSummary, type DashboardSummary } from "@/lib/api/dashboard";
import { ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { ServiceUnavailableBanner } from "@/components/shell/ServiceUnavailableBanner";
import { BudgetProvisionalNotice } from "@/components/finance/BudgetProvisionalNotice";
import { formatAuditActivityLine } from "@/lib/domain/audit-display";
import { activityRecordHref, expiryWatchlistHref } from "@/lib/domain/dashboard-links";
import { DashboardMetricScopeNote } from "@/components/dashboard/DashboardMetricScopeNote";

const PO_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  CANCELLED: "Cancelled",
};

const PO_STATUS_COLORS: Record<string, string> = {
  DRAFT: CHART.slate,
  SUBMITTED: CHART.amber,
  APPROVED: CHART.green,
  CANCELLED: CHART.rose,
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function assetDonutData(assets: NonNullable<DashboardSummary["assets"]>) {
  return [
    { name: "In stock", value: assets.inStock, color: CHART.green, href: "/assets?status=IN_STOCK" },
    { name: "Issued", value: assets.issued, color: CHART.brand, href: "/assets?status=ISSUED" },
    {
      name: "Under maintenance",
      value: assets.underMaintenance,
      color: CHART.amber,
      href: "/assets?status=UNDER_MAINTENANCE",
    },
    { name: "Retired", value: assets.retired, color: CHART.slate, href: "/assets?status=RETIRED" },
  ].filter((d) => d.value > 0);
}

function maintenanceRows(m: NonNullable<DashboardSummary["maintenance"]>) {
  return [
    { label: "Open", value: m.open, color: CHART.amber, href: "/maintenance" },
    { label: "In progress", value: m.inProgress, color: CHART.blue, href: "/maintenance" },
    { label: "Completed", value: m.completed, color: CHART.green, href: "/maintenance" },
    { label: "Cancelled", value: m.cancelled, color: CHART.slate, href: "/maintenance" },
  ].filter((r) => r.value > 0);
}

function kpiGridClass(count: number): string {
  if (count <= 1) return "grid grid-cols-1 gap-4";
  if (count === 2) return "grid grid-cols-1 gap-4 sm:grid-cols-2";
  if (count === 3) return "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
  return "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4";
}

export default function DashboardPage() {
  const router = useRouter();
  const { session, hasPermission, serviceUnavailable } = useAuth();
  const dateRange = useDashboardDateRange();
  const filterParams = useDashboardFilterParams();
  const firstName =
    session.status === "authenticated" ? session.user.displayName.split(" ")[0] : "there";

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: [
      "dashboard",
      "summary",
      dateRange.from,
      dateRange.to,
      filterParams.departmentId,
      filterParams.financialYearId,
      filterParams.poStatus,
      filterParams.assetCategoryId,
      filterParams.assetStatus,
    ],
    queryFn: () =>
      fetchDashboardSummary({
        from: dateRange.from,
        to: dateRange.to,
        ...filterParams,
      }),
    staleTime: 30_000,
    enabled: session.status === "authenticated" && !serviceUnavailable,
  });

  const filteredRecentActivity = filterRecentActivityByRange(data?.recentActivity, dateRange);

  const networkDown = error instanceof ApiClientError && error.status === 0;
  const forbidden = error instanceof ApiClientError && error.status === 403;

  const quickActions = [
    hasPermission(PermissionKeys.assetsManage)
      ? { href: "/assets/new", label: "Register asset", icon: Plus }
      : null,
    hasPermission(PermissionKeys.assetsManage)
      ? { href: "/assets/new?kind=non_asset", label: "Register non-asset", icon: Package }
      : null,
    hasPermission(PermissionKeys.assetsIssue)
      ? { href: "/asset-issuance", label: "Issue asset", icon: ArrowLeftRight }
      : null,
    hasPermission(PermissionKeys.invoicesManage)
      ? { href: "/invoices/new", label: "Create invoice", icon: Receipt }
      : null,
    hasPermission(PermissionKeys.reportsRead)
      ? { href: "/reports", label: "Open reports", icon: FileText }
      : null,
  ].filter(Boolean) as Array<{ href: string; label: string; icon: typeof Plus }>;

  const inventoryKpis: React.ReactNode[] = [];
  const peopleOpsKpis: React.ReactNode[] = [];

  if (isLoading) {
    for (let i = 0; i < 4; i += 1) {
      inventoryKpis.push(<Skeleton key={`sk-a-${i}`} className="h-[108px] rounded-xl" />);
    }
    for (let i = 0; i < 4; i += 1) {
      peopleOpsKpis.push(<Skeleton key={`sk-p-${i}`} className="h-[108px] rounded-xl" />);
    }
  } else if (data) {
    if (data.assets) {
      inventoryKpis.push(
        <KpiCard
          key="assets-reg"
          label="Registered assets"
          value={data.assets.registered}
          icon={Package}
          tone="violet"
          href={hasPermission(PermissionKeys.assetsRead) ? "/assets" : undefined}
        />,
        <KpiCard
          key="assets-stock"
          label="Available in stock"
          value={data.assets.inStock}
          icon={Monitor}
          tone="green"
          href={hasPermission(PermissionKeys.assetsRead) ? "/assets?status=IN_STOCK" : undefined}
        />,
        <KpiCard
          key="assets-issued"
          label="Issued assets"
          value={data.assets.issued}
          icon={ArrowLeftRight}
          tone="blue"
          href={hasPermission(PermissionKeys.assetsRead) ? "/assets?status=ISSUED" : undefined}
        />,
        <KpiCard
          key="assets-maint"
          label="Under maintenance"
          value={data.assets.underMaintenance}
          icon={Wrench}
          tone="amber"
          href={
            hasPermission(PermissionKeys.assetsRead) ? "/assets?status=UNDER_MAINTENANCE" : undefined
          }
        />,
      );
    }
    if (data.nonAssetStock) {
      inventoryKpis.push(
        <KpiCard
          key="non-asset"
          label="Non-asset stock items"
          value={data.nonAssetStock.registeredItemCount}
          icon={Package}
          tone="neutral"
          href={hasPermission(PermissionKeys.assetsRead) ? "/assets?view=non-asset" : undefined}
        />,
      );
    }
    if (data.employees) {
      peopleOpsKpis.push(
        <KpiCard
          key="emp-active"
          label="Active employees"
          value={data.employees.active}
          icon={Users}
          tone="violet"
          href={hasPermission(PermissionKeys.employeesRead) ? "/employees" : undefined}
        />,
      );
    }
    if (data.maintenance) {
      peopleOpsKpis.push(
        <KpiCard
          key="maint-open"
          label="Open maintenance cases"
          value={data.maintenance.open + data.maintenance.inProgress}
          icon={Wrench}
          tone="amber"
          href={hasPermission(PermissionKeys.maintenanceRead) ? "/maintenance" : undefined}
        />,
      );
    }
    if (data.contracts) {
      const days = data.contracts.expiringWithinDays;
      peopleOpsKpis.push(
        <KpiCard
          key="contracts-exp"
          label={`Contracts expiring (${days}d)`}
          value={data.contracts.expiringCount}
          icon={FileText}
          tone="amber"
          href={
            hasPermission(PermissionKeys.contractsRead)
              ? `/contracts?expiringWithin=${days}`
              : undefined
          }
        />,
      );
    }
    if (data.licenses) {
      const days = data.licenses.expiringWithinDays;
      peopleOpsKpis.push(
        <KpiCard
          key="lic-exp"
          label={`Licenses expiring (${days}d)`}
          value={data.licenses.expiringCount}
          icon={KeyRound}
          tone="rose"
          href={
            hasPermission(PermissionKeys.licensesRead)
              ? `/software-licenses?expiringWithin=${days}`
              : undefined
          }
        />,
      );
    }
    if (data.notifications) {
      peopleOpsKpis.push(
        <KpiCard
          key="notif"
          label="Unread notifications"
          value={data.notifications.unread}
          icon={Bell}
          tone="blue"
          href={hasPermission(PermissionKeys.notificationsRead) ? "/notifications" : undefined}
        />,
      );
    }
  }

  const hasAnySection = (data?.sectionsIncluded.length ?? 0) > 0;
  const poRows = data?.purchaseOrders
    ? Object.entries(data.purchaseOrders.byStatus).map(([status, value]) => ({
        label: PO_STATUS_LABELS[status] ?? status,
        value,
        color: PO_STATUS_COLORS[status] ?? CHART.slate,
        href: "/purchase-orders",
      }))
    : [];
  const maintRows = data?.maintenance ? maintenanceRows(data.maintenance) : [];
  const movementRows =
    data?.movements
      ? [
          {
            label: "Issuances",
            value: data.movements.issuanceDocuments,
            color: CHART.brand,
            href: "/asset-issuance",
          },
          {
            label: "Returns",
            value: data.movements.returnDocuments,
            color: CHART.green,
            href: "/asset-history",
          },
        ].filter((r) => r.value > 0)
      : [];

  const expiryWindow =
    data?.expiryWatchlist?.windowDays ??
    data?.contracts?.expiringWithinDays ??
    data?.licenses?.expiringWithinDays ??
    60;

  return (
    <div className="page-stack">
      <DashboardHero
        title={`${timeGreeting()}, ${firstName}`}
        description="IT operations analytics — metrics and charts reflect modules you are authorized to view."
        actions={
          <>
            <Button
              variant="outline"
              size="md"
              className="font-normal text-muted-foreground bg-card"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {quickActions[0] ? (
              <Button asChild size="md">
                <Link href={quickActions[0].href}>
                  {(() => {
                    const Icon = quickActions[0].icon;
                    return <Icon className="h-4 w-4" />;
                  })()}
                  {quickActions[0].label}
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <DashboardFilterBar />

      {serviceUnavailable ? <ServiceUnavailableBanner /> : null}

      {isError && !serviceUnavailable ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">
                  {networkDown
                    ? "Could not reach the ITDMS API"
                    : forbidden
                      ? "Dashboard summary not authorized"
                      : "Failed to load dashboard"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error instanceof ApiClientError ? error.message : "Try again in a moment."}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      {inventoryKpis.length > 0 ? (
        <section aria-labelledby="kpi-inventory">
          <h2
            id="kpi-inventory"
            className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Inventory
          </h2>
          <div className={kpiGridClass(inventoryKpis.length)}>{inventoryKpis}</div>
          {data?.nonAssetStock ? (
            <p className="mt-2 text-xs text-muted-foreground">{data.nonAssetStock.note}</p>
          ) : null}
        </section>
      ) : null}

      {peopleOpsKpis.length > 0 ? (
        <section aria-labelledby="kpi-ops">
          <h2
            id="kpi-ops"
            className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            People & operations
          </h2>
          <div className={kpiGridClass(peopleOpsKpis.length)}>{peopleOpsKpis}</div>
        </section>
      ) : null}

      {!isLoading &&
      !isError &&
      inventoryKpis.length + peopleOpsKpis.length === 0 &&
      !hasAnySection ? (
        <EmptyState
          icon={LayoutDashboard}
          title="No dashboard metrics for your permissions"
          description="Your account can sign in but has no read access to operational modules yet. Contact an administrator to assign permissions (D01 provisional)."
        />
      ) : null}

      {data?.budgetOverview && hasPermission(PermissionKeys.budgetsRead) && !isLoading ? (
        <section aria-labelledby="budget-strip" className="space-y-3">
          <h2
            id="budget-strip"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Budget overview{data.budgetOverview.provisional ? " (provisional)" : ""}
          </h2>
          {data.budgetOverview.provisionalNote ? (
            <BudgetProvisionalNotice message={data.budgetOverview.provisionalNote} />
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Allocated (USD)</p>
              <p className="mt-1 text-2xl font-semibold tabular">
                {formatCurrency(Number(data.budgetOverview.usdAllocatedTotal), "USD")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatNumber(data.budgetOverview.usdAllocationCount)} allocation line(s)
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Utilized (USD)</p>
              <p className="mt-1 text-2xl font-semibold tabular">
                {formatCurrency(Number(data.budgetOverview.utilizedUsdTotal), "USD")}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Actual (USD)</p>
              <p className="mt-1 text-2xl font-semibold tabular">
                {formatCurrency(Number(data.budgetOverview.actualUsdTotal), "USD")}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Remaining (USD)</p>
              <p className="mt-1 text-2xl font-semibold tabular">
                {data.budgetOverview.remainingUsdTotal !== null
                  ? formatCurrency(Number(data.budgetOverview.remainingUsdTotal), "USD")
                  : "Provisional"}
              </p>
            </Card>
          </div>
          <p className="text-xs text-muted-foreground">{data.budgetOverview.semanticsNote}</p>
          <Button asChild variant="link" size="sm" className="h-auto p-0">
            <Link href="/budgets">
              Open budgets
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </section>
      ) : null}

      {!isLoading && data ? (
        <>
          <section className="grid grid-cols-12 gap-6">
            {data.assets ? (
              <Card className="col-span-12 min-w-0 lg:col-span-7">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">Asset distribution</CardTitle>
                  <Button asChild variant="link" size="sm" className="h-auto p-0 text-primary">
                    <Link href="/assets">View all</Link>
                  </Button>
                </CardHeader>
                <CardContent className="min-h-[14rem] flex items-center justify-center py-4">
                  <StatusDonut
                    data={assetDonutData(data.assets)}
                    total={data.assets.registered}
                    emptyLabel="No assets registered yet."
                    onSliceActivate={(slice) => {
                      if (slice.href) router.push(slice.href);
                    }}
                  />
                </CardContent>
              </Card>
            ) : null}

            {data.purchaseOrders ? (
              <Card className="col-span-12 min-w-0 lg:col-span-5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">Purchase order status</CardTitle>
                  <Button asChild variant="link" size="sm" className="h-auto p-0 text-primary">
                    <Link href="/purchase-orders">View all</Link>
                  </Button>
                </CardHeader>
                <CardContent className="min-h-[11rem] py-2 flex flex-col justify-center">
                  <HorizontalBarList
                    emptyLabel="No purchase orders yet."
                    rows={poRows}
                    onRowActivate={(row) => {
                      if (row.href) router.push(row.href);
                    }}
                  />
                  <p className="mt-4 text-xs text-muted-foreground tabular">
                    Total purchase orders: {formatNumber(data.purchaseOrders.total)}
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </section>

          <section className="grid grid-cols-12 gap-6">
            {data.maintenance ? (
              <Card className="col-span-12 min-w-0 md:col-span-6 lg:col-span-4">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">Maintenance status</CardTitle>
                  <Button asChild variant="link" size="sm" className="h-auto p-0 text-primary">
                    <Link href="/maintenance">View all</Link>
                  </Button>
                </CardHeader>
                <CardContent className="min-h-[10rem] py-2 flex flex-col justify-center gap-2">
                  <DashboardMetricScopeNote>
                    Current workload — not limited by the activity date filter.
                  </DashboardMetricScopeNote>
                  <HorizontalBarList
                    emptyLabel="No maintenance records yet."
                    rows={maintRows}
                    onRowActivate={(row) => {
                      if (row.href) router.push(row.href);
                    }}
                  />
                </CardContent>
              </Card>
            ) : null}

            {data.movements ? (
              <Card className="col-span-12 min-w-0 md:col-span-6 lg:col-span-4">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">Issuance & returns</CardTitle>
                  <Button asChild variant="link" size="sm" className="h-auto p-0 text-primary">
                    <Link href="/asset-issuance">Open</Link>
                  </Button>
                </CardHeader>
                <CardContent className="min-h-[10rem] py-2 flex flex-col justify-center">
                  <HorizontalBarList
                    emptyLabel="No issuance or return documents yet."
                    rows={
                      movementRows.length
                        ? movementRows
                        : [
                            {
                              label: "Issuances",
                              value: data.movements.issuanceDocuments,
                              color: CHART.brand,
                              href: "/asset-issuance",
                            },
                            {
                              label: "Returns",
                              value: data.movements.returnDocuments,
                              color: CHART.green,
                              href: "/asset-history",
                            },
                          ]
                    }
                    onRowActivate={(row) => {
                      if (row.href) router.push(row.href);
                    }}
                  />
                </CardContent>
              </Card>
            ) : null}

            {(data.contracts || data.licenses || data.nonAssetStock) && (
              <Card className="col-span-12 min-w-0 lg:col-span-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Inventory & expiry summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {data.nonAssetStock ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Non-asset items</span>
                      <span className="font-semibold tabular">
                        {formatNumber(data.nonAssetStock.registeredItemCount)}
                      </span>
                    </div>
                  ) : null}
                  {data.contracts ? (
                    <>
                      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                        <span className="text-muted-foreground">Active contracts</span>
                        <span className="font-semibold tabular">
                          {formatNumber(data.contracts.active)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground leading-snug">
                          Expiring within {data.contracts.expiringWithinDays} days
                        </span>
                        <span className="font-semibold tabular shrink-0">
                          {formatNumber(data.contracts.expiringCount)}
                        </span>
                      </div>
                    </>
                  ) : null}
                  {data.licenses ? (
                    <>
                      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                        <span className="text-muted-foreground">Active licenses</span>
                        <span className="font-semibold tabular">
                          {formatNumber(data.licenses.active)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground leading-snug">
                          Licenses expiring ({data.licenses.expiringWithinDays}d)
                        </span>
                        <span className="font-semibold tabular shrink-0">
                          {formatNumber(data.licenses.expiringCount)}
                        </span>
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </section>

          <section className="grid grid-cols-12 gap-6">
            {data.expiryWatchlist ? (
              <Card className="col-span-12 min-w-0 lg:col-span-5">
                <CardHeader className="flex flex-col items-start gap-1 pb-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-base">
                    Expiry watchlist ({expiryWindow}d)
                  </CardTitle>
                  <DashboardMetricScopeNote>
                    As-of today — not scoped by activity date or financial year filters.
                  </DashboardMetricScopeNote>
                </CardHeader>
                <CardContent className="max-h-80 overflow-y-auto scrollbar-thin pr-1">
                  {data.expiryWatchlist.items.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Nothing expiring within {expiryWindow} days.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {data.expiryWatchlist.items.map((item) => (
                        <li key={`${item.kind}-${item.id}`}>
                          <Link
                            href={expiryWatchlistHref(item.kind, item.id)}
                            className="flex items-start justify-between gap-3 py-3 transition-colors hover:bg-muted/40 -mx-2 px-2 rounded-lg"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{item.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.kind === "contract" ? "Contract" : "Software license"} ·{" "}
                                {item.expiryDate}
                              </p>
                            </div>
                            <span className="shrink-0 text-xs font-semibold tabular text-primary">
                              {item.daysRemaining}d
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {data.recentActivity ? (
              <Card className="col-span-12 min-w-0 lg:col-span-7">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent activity</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Date filter applies to this list only until the dashboard summary API accepts range
                    parameters for all KPI sections.
                  </p>
                </CardHeader>
                <CardContent className="max-h-80 overflow-y-auto scrollbar-thin pr-1">
                  <div className="flex flex-col gap-0.5">
                    {filteredRecentActivity.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No audit events in the selected period.
                      </div>
                    ) : (
                      filteredRecentActivity.slice(0, 8).map((a) => {
                        const href = activityRecordHref(a.targetType, a.targetId);
                        const body = (
                          <>
                            <UserAvatar name={a.actorDisplayName ?? "System"} size={36} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm leading-snug">
                                <span className="font-medium">
                                  {a.actorDisplayName ?? "System"}
                                </span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatAuditActivityLine(a.action, a.targetType)}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {relativeTime(a.occurredAt)}
                              </p>
                            </div>
                          </>
                        );
                        return href ? (
                          <Link
                            key={a.id}
                            href={href}
                            className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                          >
                            {body}
                          </Link>
                        ) : (
                          <div
                            key={a.id}
                            className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-2.5"
                          >
                            {body}
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </section>

          {quickActions.length > 0 ? (
            <Card className="border-primary/15 bg-primary/[0.03]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button key={action.href + action.label} asChild variant="outline" size="sm">
                      <Link href={action.href}>
                        <Icon className="h-4 w-4" />
                        {action.label}
                      </Link>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : isLoading ? (
        <section className="grid grid-cols-12 gap-6">
          <Skeleton className="col-span-12 h-64 rounded-xl lg:col-span-7" />
          <Skeleton className="col-span-12 h-64 rounded-xl lg:col-span-5" />
        </section>
      ) : null}
    </div>
  );
}

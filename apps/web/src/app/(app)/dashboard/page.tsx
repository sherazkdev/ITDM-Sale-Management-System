"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Briefcase,
  FileText,
  LayoutDashboard,
  Monitor,
  Package,
  RefreshCw,
  Users,
  Wrench,
} from "lucide-react";

import { KpiCard } from "@/components/common/KpiCard";
import { QuickTip } from "@/components/common/QuickTip";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/avatar";
import { CHART, HorizontalBarList, StatusDonut } from "@/components/dashboard/DashboardCharts";
import { DashboardHero } from "@/components/premium/DashboardHero";
import { fetchDashboardSummary, type DashboardSummary } from "@/lib/api/dashboard";
import { ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { formatNumber } from "@/lib/utils";
import { ServiceUnavailableBanner } from "@/components/shell/ServiceUnavailableBanner";
import { BudgetProvisionalNotice } from "@/components/finance/BudgetProvisionalNotice";
import { BUDGET_LEDGER_SEMANTICS, BUDGET_PROVISIONAL_NOTICE } from "@/lib/domain/budget-ui";
import { formatAuditActivityLine } from "@/lib/domain/audit-display";

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
    { name: "In stock", value: assets.inStock, color: CHART.green },
    { name: "Issued", value: assets.issued, color: CHART.brand },
    { name: "Under maintenance", value: assets.underMaintenance, color: CHART.amber },
    { name: "Retired", value: assets.retired, color: CHART.slate },
  ].filter((d) => d.value > 0);
}

function maintenanceRows(m: NonNullable<DashboardSummary["maintenance"]>) {
  return [
    { label: "Open", value: m.open, color: CHART.amber },
    { label: "In progress", value: m.inProgress, color: CHART.blue },
    { label: "Completed", value: m.completed, color: CHART.green },
    { label: "Cancelled", value: m.cancelled, color: CHART.slate },
  ].filter((r) => r.value > 0);
}

function kpiGridClass(count: number): string {
  if (count <= 1) return "grid grid-cols-1 gap-4";
  if (count === 2) return "grid grid-cols-1 gap-4 sm:grid-cols-2";
  if (count === 3) return "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
  return "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4";
}

function chartContentClass(rowCount: number): string {
  if (rowCount <= 1) return "min-h-[9rem] py-2 flex flex-col justify-center";
  if (rowCount <= 3) return "min-h-[11rem] py-2 flex flex-col justify-center";
  return "min-h-[14rem] py-2 flex flex-col justify-center";
}

export default function DashboardPage() {
  const { session, hasPermission, serviceUnavailable } = useAuth();
  const firstName =
    session.status === "authenticated" ? session.user.displayName.split(" ")[0] : "there";

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: fetchDashboardSummary,
    staleTime: 30_000,
    enabled: session.status === "authenticated" && !serviceUnavailable,
  });

  const networkDown = error instanceof ApiClientError && error.status === 0;
  const forbidden = error instanceof ApiClientError && error.status === 403;

  const quickLinks = [
    hasPermission(PermissionKeys.employeesRead)
      ? { href: "/employees", label: "Employees", icon: Users }
      : null,
    hasPermission(PermissionKeys.assetsRead)
      ? { href: "/assets", label: "Assets", icon: Monitor }
      : null,
    hasPermission(PermissionKeys.purchaseOrdersRead)
      ? { href: "/purchase-orders", label: "Purchase orders", icon: FileText }
      : null,
    hasPermission(PermissionKeys.notificationsRead)
      ? { href: "/notifications", label: "Notifications", icon: Bell }
      : null,
  ].filter(Boolean) as Array<{ href: string; label: string; icon: typeof Users }>;

  const assetKpis: React.ReactNode[] = [];
  const peopleKpis: React.ReactNode[] = [];
  const opsKpis: React.ReactNode[] = [];

  if (isLoading) {
    for (let i = 0; i < 4; i += 1) {
      assetKpis.push(<Skeleton key={`sk-a-${i}`} className="h-[108px] rounded-xl" />);
    }
  } else if (data) {
    if (data.assets) {
      assetKpis.push(
        <KpiCard
          key="assets-reg"
          label="Registered assets"
          value={data.assets.registered}
          icon={Package}
          tone="violet"
          href={hasPermission(PermissionKeys.assetsRead) ? "/assets" : undefined}
        />,
        <KpiCard
          key="assets-issued"
          label="Issued assets"
          value={data.assets.issued}
          icon={Briefcase}
          tone="green"
          href={hasPermission(PermissionKeys.assetsRead) ? "/assets" : undefined}
        />,
        <KpiCard
          key="assets-stock"
          label="Available in stock"
          value={data.assets.inStock}
          icon={Package}
          tone="blue"
          href={hasPermission(PermissionKeys.assetsRead) ? "/assets" : undefined}
        />,
      );
    }
    if (data.employees) {
      peopleKpis.push(
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
    if (data.contracts) {
      peopleKpis.push(
        <KpiCard
          key="contracts-exp"
          label={`Contracts expiring within ${data.contracts.expiringWithinDays} days`}
          value={data.contracts.expiringCount}
          icon={FileText}
          tone="amber"
          href={hasPermission(PermissionKeys.contractsRead) ? "/contracts" : undefined}
        />,
      );
    }
    if (data.licenses) {
      peopleKpis.push(
        <KpiCard
          key="lic-exp"
          label={`Software licenses expiring within ${data.licenses.expiringWithinDays} days`}
          value={data.licenses.expiringCount}
          icon={Wrench}
          tone="rose"
          href={hasPermission(PermissionKeys.licensesRead) ? "/software-licenses" : undefined}
        />,
      );
    }
    if (data.notifications) {
      opsKpis.push(
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
    if (data.maintenance) {
      opsKpis.push(
        <KpiCard
          key="maint-open"
          label="Open maintenance requests"
          value={data.maintenance.open + data.maintenance.inProgress}
          icon={Wrench}
          tone="amber"
          href={hasPermission(PermissionKeys.maintenanceRead) ? "/maintenance" : undefined}
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
      }))
    : [];
  const maintRows = data?.maintenance ? maintenanceRows(data.maintenance) : [];

  return (
    <div className="page-stack">
      <DashboardHero
        title={`${timeGreeting()}, ${firstName}`}
        description="Operational snapshot from ITDMS — metrics and charts reflect modules you are authorized to view."
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
            {quickLinks[0] ? (
              <Button asChild size="md">
                <Link href={quickLinks[0].href}>
                  {(() => {
                    const Icon = quickLinks[0].icon;
                    return <Icon className="h-4 w-4" />;
                  })()}
                  {quickLinks[0].label}
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

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

      {assetKpis.length > 0 ? (
        <section aria-labelledby="kpi-assets">
          <h2 id="kpi-assets" className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Asset operations
          </h2>
          <div className={kpiGridClass(assetKpis.length)}>{assetKpis}</div>
        </section>
      ) : null}

      {peopleKpis.length > 0 ? (
        <section aria-labelledby="kpi-people">
          <h2 id="kpi-people" className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            People & contracts
          </h2>
          <div className={kpiGridClass(peopleKpis.length)}>{peopleKpis}</div>
        </section>
      ) : null}

      {opsKpis.length > 0 ? (
        <section aria-labelledby="kpi-ops">
          <h2 id="kpi-ops" className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Operations
          </h2>
          <div className={kpiGridClass(opsKpis.length)}>{opsKpis}</div>
        </section>
      ) : null}

      {!isLoading && !isError && assetKpis.length + peopleKpis.length + opsKpis.length === 0 && !hasAnySection ? (
        <EmptyState
          icon={LayoutDashboard}
          title="No dashboard metrics for your permissions"
          description="Your account can sign in but has no read access to operational modules yet. Contact an administrator to assign permissions (D01 provisional)."
        />
      ) : null}

      {hasPermission(PermissionKeys.budgetsRead) && !isLoading ? (
        <BudgetProvisionalNotice
          message={`Invoice posting and payments follow approved Wave 2 rules. ${BUDGET_LEDGER_SEMANTICS} ${BUDGET_PROVISIONAL_NOTICE}`}
        />
      ) : null}

      {!isLoading && data ? (
        <>
          <section className="grid grid-cols-12 gap-6">
            {data.purchaseOrders ? (
              <Card className="col-span-12 min-w-0 lg:col-span-7">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">Purchase order status</CardTitle>
                  <Button asChild variant="link" size="sm" className="h-auto p-0 text-primary">
                    <Link href="/purchase-orders">View all</Link>
                  </Button>
                </CardHeader>
                <CardContent className={chartContentClass(poRows.length)}>
                  <HorizontalBarList
                    emptyLabel="No purchase orders yet."
                    rows={poRows}
                  />
                  <p className="mt-4 text-xs text-muted-foreground tabular">
                    Total purchase orders: {formatNumber(data.purchaseOrders.total)}
                  </p>
                </CardContent>
              </Card>
            ) : data.assets ? (
              <Card className="col-span-12 min-w-0 lg:col-span-7">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">Asset register</CardTitle>
                  <Button asChild variant="link" size="sm" className="h-auto p-0 text-primary">
                    <Link href="/assets">View all</Link>
                  </Button>
                </CardHeader>
                <CardContent className="min-h-[12rem] flex items-center justify-center py-4">
                  <StatusDonut
                    data={assetDonutData(data.assets)}
                    total={data.assets.registered}
                    emptyLabel="No assets registered yet."
                    size="compact"
                  />
                </CardContent>
              </Card>
            ) : null}

            {data.maintenance ? (
              <Card className="col-span-12 lg:col-span-5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">Maintenance pipeline</CardTitle>
                  <Button asChild variant="link" size="sm" className="h-auto p-0 text-primary">
                    <Link href="/maintenance">View all</Link>
                  </Button>
                </CardHeader>
                <CardContent className={chartContentClass(maintRows.length)}>
                  <HorizontalBarList
                    emptyLabel="No maintenance records yet."
                    rows={maintRows}
                  />
                </CardContent>
              </Card>
            ) : null}
          </section>

          <section className="grid grid-cols-12 gap-6">
            {data.recentActivity ? (
              <Card className="col-span-12 min-w-0 lg:col-span-7">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent activity</CardTitle>
                </CardHeader>
                <CardContent className="max-h-80 overflow-y-auto scrollbar-thin pr-1">
                  <div className="flex flex-col gap-0.5">
                    {data.recentActivity.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No audit events recorded yet.
                      </div>
                    ) : (
                      data.recentActivity.slice(0, 8).map((a) => (
                        <div
                          key={a.id}
                          className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                        >
                          <UserAvatar name={a.actorDisplayName ?? "System"} size={36} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-snug">
                              <span className="font-medium">{a.actorDisplayName ?? "System"}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatAuditActivityLine(a.action, a.targetType)}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {relativeTime(a.occurredAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {(data.contracts || data.licenses || data.notifications) && (
              <Card className="col-span-12 min-w-0 lg:col-span-5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {data.contracts ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Active contracts</span>
                        <span className="font-semibold tabular">{formatNumber(data.contracts.active)}</span>
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
                      <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
                        <span className="text-muted-foreground">Active licenses</span>
                        <span className="font-semibold tabular">{formatNumber(data.licenses.active)}</span>
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
                  {data.notifications ? (
                    <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
                      <span className="text-muted-foreground">Unread notifications</span>
                      <span className="text-xl font-semibold tabular text-primary">
                        {formatNumber(data.notifications.unread)}
                      </span>
                    </div>
                  ) : null}
                  {hasPermission(PermissionKeys.contractsRead) ? (
                    <Button asChild variant="link" size="sm" className="h-auto p-0">
                      <Link href="/contracts">Open contracts</Link>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </section>

          {quickLinks.length > 1 ? (
            <QuickTip title="Quick navigation" className="items-center">
              <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {quickLinks.slice(1).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    {link.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </span>
            </QuickTip>
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

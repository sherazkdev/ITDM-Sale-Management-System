"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, KeyRound } from "lucide-react";

import { utcDatePlusDays } from "@/lib/domain/dashboard-links";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { FilterSelect } from "@/components/common/FilterSelect";
import { ListToolbar } from "@/components/crud/ListToolbar";
import type { ActiveFilterChip } from "@/components/common/ActiveFilterChips";
import { PolicyNotApprovedNotice } from "@/components/procurement/PolicyNotApprovedNotice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchSoftwareLicenses, type SoftwareLicense } from "@/lib/api/software-licenses";
import { useServerListTable } from "@/lib/hooks/use-server-list-table";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { ApiClientError } from "@/lib/api/client";
import { LICENSE_RENEW_BLOCKED_MESSAGE } from "@/lib/domain/license-ui";
import { ReportListExportMenu } from "@/components/data-management/ReportListExportMenu";
import { licenseListCell } from "@/lib/list-entity-cells";

export default function SoftwareLicensesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = useAuth();
  const initialBefore = useMemo(() => {
    const days = Number(searchParams.get("expiringWithin") ?? "");
    if (Number.isFinite(days) && days > 0) return utcDatePlusDays(days);
    return searchParams.get("before") ?? "";
  }, [searchParams]);

  const list = useServerListTable({
    defaults: { page: 1, pageSize: 20, before: initialBefore },
    defaultSortBy: "expiryDate",
  });
  const expiringBefore = list.extras.before ?? "";

  const sortParams = useMemo(
    () => ({
      sortBy: list.sortBy || "expiryDate",
      sortDir: list.sortDir,
    }),
    [list.sortBy, list.sortDir],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["software-licenses", list.page, list.pageSize, expiringBefore, sortParams],
    queryFn: () =>
      fetchSoftwareLicenses({
        page: list.page,
        pageSize: list.pageSize,
        before: expiringBefore || undefined,
        sortBy: sortParams.sortBy,
        sortDir: sortParams.sortDir,
      }),
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / list.pageSize));

  const activeFilterChips = useMemo((): ActiveFilterChip[] => {
    if (!expiringBefore) return [];
    return [
      {
        id: "before",
        label: `Expiring before ${expiringBefore}`,
        onRemove: () => list.patch({ extras: { before: "" }, page: 1 }),
      },
    ];
  }, [expiringBefore, list]);

  const columns: Column<SoftwareLicense>[] = [
    {
      key: "name",
      header: "Software",
      sortable: true,
      serverSortKey: "softwareName",
      cell: (r) => licenseListCell(r),
    },
    {
      key: "vendor",
      header: "Vendor",
      cell: (r) => r.vendor?.vendorName ?? "—",
    },
    {
      key: "expiry",
      header: "Expiry",
      sortable: true,
      serverSortKey: "expiryDate",
      cell: (r) => r.expiryDate?.slice(0, 10),
    },
    {
      key: "qty",
      header: "Qty",
      hideOnMobile: true,
      cell: (r) => r.licenseQuantity,
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title="Software licenses"
        description="License register and expiry tracking."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {hasPermission(PermissionKeys.reportsRead) ? (
              <ReportListExportMenu
                listKey="software-licenses"
                filterParams={{ before: expiringBefore || undefined }}
              />
            ) : null}
            {hasPermission(PermissionKeys.licensesManage) ? (
              <Button asChild size="md">
                <Link href="/software-licenses/new">
                  <Plus className="h-4 w-4" />
                  New license
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <PolicyNotApprovedNotice title="Renewal unavailable" message={LICENSE_RENEW_BLOCKED_MESSAGE} />

      <ListToolbar
        showSearch={false}
        filters={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <FilterSelect
              aria-label="Expiry window"
              value=""
              onChange={(v) => {
                if (!v) {
                  list.patch({ extras: { before: "" }, page: 1 });
                  return;
                }
                const days = Number(v);
                if (Number.isFinite(days) && days > 0) {
                  list.patch({ extras: { before: utcDatePlusDays(days) }, page: 1 });
                }
              }}
              placeholder="Expiry window"
              className="w-full sm:w-44"
              options={[
                { value: "", label: "Any expiry" },
                { value: "30", label: "Within 30 days" },
                { value: "60", label: "Within 60 days" },
                { value: "90", label: "Within 90 days" },
              ]}
            />
            <div className="flex min-w-0 flex-col gap-1 sm:w-48">
              <Label htmlFor="before" className="text-xs text-muted-foreground">
                Expiring before
              </Label>
              <Input
                id="before"
                type="date"
                value={expiringBefore}
                onChange={(e) => {
                  list.patch({ extras: { before: e.target.value }, page: 1 });
                }}
              />
            </div>
          </div>
        }
        activeFilterChips={activeFilterChips}
        onResetFilters={() => list.patch({ extras: { before: "" }, page: 1 })}
      />

      {isError ? (
        <Card className="p-4 text-sm text-destructive">
          {error instanceof ApiClientError ? error.message : "Failed to load licenses."}{" "}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <DataTable
          tableId="software-licenses"
          sortMode="server"
          serverSort={sortParams}
          onServerSortChange={list.onServerSortChange}
          data={rows}
          columns={columns}
          getRowId={(r) => r.licenseId}
          loading={isLoading}
          caption="Software license register"
          onRowClick={(r) => router.push(`/software-licenses/${r.licenseId}`)}
          empty={
            <EmptyState icon={KeyRound} title="No licenses" description="Register a software license." />
          }
        />
        <div className="border-t border-border p-4">
          <Pagination
            page={list.page}
            totalPages={totalPages}
            total={total}
            pageSize={list.pageSize}
            onPageChange={(p) => list.patch({ page: p })}
            onPageSizeChange={(s) => {
              list.patch({ pageSize: s, page: 1 });
            }}
            itemLabel="licenses"
          />
        </div>
      </Card>
    </div>
  );
}

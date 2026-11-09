"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Wrench } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { FilterSelect } from "@/components/common/FilterSelect";
import { ListToolbar } from "@/components/crud/ListToolbar";
import type { ActiveFilterChip } from "@/components/common/ActiveFilterChips";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchMaintenanceRecords, type MaintenanceRecord } from "@/lib/api/maintenance";
import { useServerListTable } from "@/lib/hooks/use-server-list-table";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { ApiClientError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { ReportListExportMenu } from "@/components/data-management/ReportListExportMenu";
import { maintenanceListCell } from "@/lib/list-entity-cells";

const STATUS_FILTER = [
  { value: "", label: "All statuses" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function MaintenancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = useAuth();
  const list = useServerListTable({
    defaults: {
      page: 1,
      pageSize: 20,
      sortDir: "desc",
      status: "",
      assetId: searchParams.get("assetId") ?? "",
    },
    defaultSortBy: "requestDate",
  });
  const status = list.extras.status ?? "";
  const assetId = list.extras.assetId ?? "";

  const sortParams = useMemo(
    () => ({
      sortBy: list.sortBy || "requestDate",
      sortDir: list.sortDir,
    }),
    [list.sortBy, list.sortDir],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["maintenance-records", list.page, list.pageSize, status, assetId, sortParams],
    queryFn: () =>
      fetchMaintenanceRecords({
        page: list.page,
        pageSize: list.pageSize,
        status: status || undefined,
        assetId: assetId || undefined,
        sortBy: sortParams.sortBy,
        sortDir: sortParams.sortDir,
      }),
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / list.pageSize));

  const activeFilterChips = useMemo((): ActiveFilterChip[] => {
    const chips: ActiveFilterChip[] = [];
    if (status) {
      const label = STATUS_FILTER.find((o) => o.value === status)?.label ?? status;
      chips.push({
        id: "status",
        label: `Status: ${label}`,
        onRemove: () => list.patch({ extras: { status: "", assetId }, page: 1 }),
      });
    }
    if (assetId) {
      chips.push({
        id: "assetId",
        label: `Asset #${assetId}`,
        onRemove: () => list.patch({ extras: { status, assetId: "" }, page: 1 }),
      });
    }
    return chips;
  }, [status, assetId, list]);

  const columns: Column<MaintenanceRecord>[] = [
    {
      key: "type",
      header: "Request",
      sortable: true,
      serverSortKey: "maintenanceType",
      cell: (r) => maintenanceListCell(r),
    },
    {
      key: "requestDate",
      header: "Requested",
      hideOnMobile: true,
      sortable: true,
      serverSortKey: "requestDate",
      cell: (r) => r.requestDate?.slice(0, 10),
    },
    {
      key: "cost",
      header: "Cost",
      cell: (r) => (r.cost != null ? formatCurrency(Number(r.cost), "USD") : "—"),
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title="Maintenance"
        description="Asset, contract, and vendor maintenance records."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {hasPermission(PermissionKeys.reportsRead) ? (
              <ReportListExportMenu
                listKey="maintenance"
                filterParams={{
                  status: status || undefined,
                  assetId: assetId || undefined,
                }}
              />
            ) : null}
            {hasPermission(PermissionKeys.maintenanceManage) ? (
              <Button asChild size="md">
                <Link href="/maintenance/new">
                  <Plus className="h-4 w-4" />
                  New request
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <ListToolbar
        showSearch={false}
        filters={
          <FilterSelect
            aria-label="Status filter"
            value={status}
            onChange={(v) => list.patch({ extras: { status: v, assetId }, page: 1 })}
            options={STATUS_FILTER}
            placeholder="All statuses"
            className="w-full sm:w-48"
          />
        }
        activeFilterChips={activeFilterChips}
        onResetFilters={() =>
          list.patch({
            extras: { status: "", assetId: "" },
            page: 1,
          })
        }
      />

      {isError ? (
        <Card className="p-4 text-sm text-destructive">
          {error instanceof ApiClientError ? error.message : "Failed to load maintenance."}{" "}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <DataTable
          tableId="maintenance"
          sortMode="server"
          serverSort={sortParams}
          onServerSortChange={list.onServerSortChange}
          data={rows}
          columns={columns}
          getRowId={(r) => r.maintenanceId}
          loading={isLoading}
          caption="Maintenance records"
          onRowClick={(r) => router.push(`/maintenance/${r.maintenanceId}`)}
          empty={
            <EmptyState icon={Wrench} title="No maintenance records" description="Create a maintenance request." />
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
            itemLabel="records"
          />
        </div>
      </Card>
    </div>
  );
}

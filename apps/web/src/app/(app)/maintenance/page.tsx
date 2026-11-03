"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Wrench } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Pagination } from "@/components/common/Pagination";
import { StatusPill } from "@/components/common/StatusPill";
import { EmptyState } from "@/components/common/EmptyState";
import { FilterSelect } from "@/components/common/FilterSelect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchMaintenanceRecords, type MaintenanceRecord } from "@/lib/api/maintenance";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { ApiClientError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { MAINTENANCE_STATUS_LABELS, maintenanceStatusToPill } from "@/lib/domain/maintenance-ui";

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
  const assetFilter = searchParams.get("assetId") ?? "";
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["maintenance-records", page, pageSize, status, assetFilter],
    queryFn: () =>
      fetchMaintenanceRecords({
        page,
        pageSize,
        status: status || undefined,
        assetId: assetFilter || undefined,
      }),
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns: Column<MaintenanceRecord>[] = [
    {
      key: "type",
      header: "Type",
      cell: (r) => r.maintenanceType,
    },
    {
      key: "asset",
      header: "Asset",
      cell: (r) => r.asset?.assetCode ?? (r.assetId ? r.assetId : "—"),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <StatusPill
          status={maintenanceStatusToPill(r.status)}
          label={MAINTENANCE_STATUS_LABELS[r.status] ?? r.status}
          dot
        />
      ),
    },
    {
      key: "requestDate",
      header: "Requested",
      hideOnMobile: true,
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
          hasPermission(PermissionKeys.maintenanceManage) ? (
            <Button asChild size="md">
              <Link href="/maintenance/new">
                <Plus className="h-4 w-4" />
                New request
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="w-full max-w-xl">
        <FilterSelect
          aria-label="Status filter"
          value={status}
          onChange={setStatus}
          options={STATUS_FILTER}
          placeholder="Status"
        />
      </div>

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
          data={rows}
          columns={columns}
          getRowId={(r) => r.maintenanceId}
          loading={isLoading}
          onRowClick={(r) => router.push(`/maintenance/${r.maintenanceId}`)}
          empty={
            <EmptyState icon={Wrench} title="No maintenance records" description="Create a maintenance request." />
          }
        />
        <div className="border-t border-border p-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
            itemLabel="records"
          />
        </div>
      </Card>
    </div>
  );
}

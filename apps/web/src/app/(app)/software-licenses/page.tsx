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

  const columns: Column<SoftwareLicense>[] = [
    {
      key: "name",
      header: "Software",
      sortable: true,
      serverSortKey: "softwareName",
      cell: (r) => <span className="font-medium">{r.softwareName}</span>,
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
    {
      key: "status",
      header: "Status",
      cell: (r) => r.status,
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

      <Card className="p-4">
        <div className="flex max-w-sm flex-col gap-2">
          <Label htmlFor="before">Expiring before (optional)</Label>
          <Input
            id="before"
            type="date"
            value={expiringBefore}
            onChange={(e) => {
              list.patch({ extras: { before: e.target.value }, page: 1 });
            }}
          />
        </div>
      </Card>

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

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
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
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { ApiClientError } from "@/lib/api/client";
import { LICENSE_RENEW_BLOCKED_MESSAGE } from "@/lib/domain/license-ui";

export default function SoftwareLicensesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const initialExpiringBefore = useMemo(() => {
    const days = Number(searchParams.get("expiringWithin") ?? "");
    if (Number.isFinite(days) && days > 0) return utcDatePlusDays(days);
    return "";
  }, [searchParams]);
  const [expiringBefore, setExpiringBefore] = useState(initialExpiringBefore);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["software-licenses", page, pageSize, expiringBefore],
    queryFn: () =>
      fetchSoftwareLicenses({
        page,
        pageSize,
        before: expiringBefore || undefined,
      }),
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns: Column<SoftwareLicense>[] = [
    {
      key: "name",
      header: "Software",
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
          hasPermission(PermissionKeys.licensesManage) ? (
            <Button asChild size="md">
              <Link href="/software-licenses/new">
                <Plus className="h-4 w-4" />
                New license
              </Link>
            </Button>
          ) : null
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
              setExpiringBefore(e.target.value);
              setPage(1);
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
          data={rows}
          columns={columns}
          getRowId={(r) => r.licenseId}
          loading={isLoading}
          onRowClick={(r) => router.push(`/software-licenses/${r.licenseId}`)}
          empty={
            <EmptyState icon={KeyRound} title="No licenses" description="Register a software license." />
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
            itemLabel="licenses"
          />
        </div>
      </Card>
    </div>
  );
}

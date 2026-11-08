"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Handshake, Plus } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { FilterSelect } from "@/components/common/FilterSelect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchContracts, type Contract } from "@/lib/api/contracts";
import { fetchVendors } from "@/lib/api/vendors";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { ApiClientError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";

function expiringBeforeDate(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function ContractsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = useAuth();
  const [vendorFilter, setVendorFilter] = useState("");
  const expiringWithinParam = Number(searchParams.get("expiringWithin") ?? "");
  const defaultExpiringDays =
    Number.isFinite(expiringWithinParam) && expiringWithinParam > 0 ? expiringWithinParam : 60;
  const [expiringOnly, setExpiringOnly] = useState(
    searchParams.get("expiringWithin") != null && searchParams.get("expiringWithin") !== "",
  );
  const [expiringDays] = useState(defaultExpiringDays);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const expiringBefore = useMemo(
    () => (expiringOnly ? expiringBeforeDate(expiringDays) : undefined),
    [expiringOnly, expiringDays],
  );

  const { data: vendorPage } = useQuery({
    queryKey: ["vendors", "filter", "contracts"],
    queryFn: () => fetchVendors({ page: 1, pageSize: 100, isActive: true }),
  });

  const vendorOptions = useMemo(
    () =>
      (vendorPage?.data ?? []).map((v) => ({
        value: v.vendorId,
        label: v.vendorName,
      })),
    [vendorPage?.data],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["contracts", page, pageSize, vendorFilter, expiringOnly, expiringDays],
    queryFn: () =>
      fetchContracts({
        page,
        pageSize,
        vendorId: vendorFilter || undefined,
        expiringBefore,
      }),
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns: Column<Contract>[] = [
    {
      key: "contractNumber",
      header: "Contract",
      sortable: true,
      cell: (c) => <span className="font-medium tabular">{c.contractNumber}</span>,
    },
    {
      key: "vendor",
      header: "Vendor",
      cell: (c) => c.vendor?.vendorName ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: "startDate",
      header: "Start",
      hideOnMobile: true,
      cell: (c) => c.startDate,
    },
    {
      key: "expiryDate",
      header: "Expires",
      cell: (c) => c.expiryDate,
    },
    {
      key: "contractValue",
      header: "Value",
      hideOnMobile: true,
      cell: (c) =>
        c.contractValue != null ? (
          formatCurrency(Number(c.contractValue))
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "renewalStatus",
      header: "Renewal",
      hideOnMobile: true,
      cell: (c) => c.renewalStatus ?? <span className="text-muted-foreground">—</span>,
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title="Contracts"
        description="Vendor and service contracts."
        actions={
          hasPermission(PermissionKeys.contractsManage) ? (
            <Button asChild size="md">
              <Link href="/contracts/new">
                <Plus className="h-4 w-4" />
                Add contract
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <FilterSelect
          aria-label="Vendor filter"
          value={vendorFilter}
          onChange={(v) => {
            setVendorFilter(v);
            setPage(1);
          }}
          placeholder="All vendors"
          options={vendorOptions}
        />
        <FilterSelect
          aria-label="Expiry filter"
          value={expiringOnly ? "expiring" : ""}
          onChange={(v) => {
            setExpiringOnly(v === "expiring");
            setPage(1);
          }}
          placeholder="All contracts"
          options={[
            { value: "expiring", label: `Expiring within ${expiringDays} days` },
          ]}
        />
      </div>

      {isError ? (
        <Card className="p-4 text-sm text-destructive">
          {error instanceof ApiClientError ? error.message : "Failed to load contracts."}{" "}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <DataTable
          tableId="contracts"
          sortMode="off"
          data={rows}
          columns={columns}
          getRowId={(c) => c.contractId}
          loading={isLoading}
          onRowClick={(c) => router.push(`/contracts/${c.contractId}`)}
          empty={
            <EmptyState
              icon={Handshake}
              title="No contracts found"
              description="Adjust filters or add a new contract."
            />
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
            itemLabel="contracts"
          />
        </div>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Building2, UserCheck } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Pagination } from "@/components/common/Pagination";
import { StatusPill } from "@/components/common/StatusPill";
import { EmptyState } from "@/components/common/EmptyState";
import { ListToolbar } from "@/components/crud/ListToolbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterSelect } from "@/components/common/FilterSelect";
import { fetchVendors, type Vendor } from "@/lib/api/vendors";
import { useServerListTable } from "@/lib/hooks/use-server-list-table";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { ListPageKpiBand } from "@/components/crud/ListPageKpiBand";
import { useListMetaTotals } from "@/lib/hooks/use-list-meta";
import { ApiClientError } from "@/lib/api/client";

const VENDOR_LIST_DEFAULTS = { page: 1, pageSize: 20, active: "all" };

export default function VendorsPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const list = useServerListTable({ defaults: VENDOR_LIST_DEFAULTS, defaultSortBy: "vendorName" });
  const activeFilter = list.extras.active ?? "all";

  const isActive =
    activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined;

  const sortParams = useMemo(
    () => ({
      sortBy: list.sortBy || "vendorName",
      sortDir: list.sortDir,
    }),
    [list.sortBy, list.sortDir],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "vendors",
      list.page,
      list.pageSize,
      list.debouncedSearch,
      activeFilter,
      sortParams.sortBy,
      sortParams.sortDir,
    ],
    queryFn: () =>
      fetchVendors({
        page: list.page,
        pageSize: list.pageSize,
        search: list.debouncedSearch || undefined,
        isActive,
        sortBy: sortParams.sortBy,
        sortDir: sortParams.sortDir,
      }),
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / list.pageSize));

  const metaTotals = useListMetaTotals(["vendors", "summary"], fetchVendors, {
    includeInactive: true,
  });

  const columns: Column<Vendor>[] = [
    {
      key: "vendorName",
      header: "Vendor",
      sortable: true,
      serverSortKey: "vendorName",
      cell: (v) => (
        <div className="min-w-0">
          <p className="font-medium truncate">{v.vendorName}</p>
          {v.registrationNumber ? (
            <p className="text-xs text-muted-foreground truncate">{v.registrationNumber}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "contactPerson",
      header: "Contact",
      hideOnMobile: true,
      cell: (v) => v.contactPerson ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: "phone",
      header: "Phone",
      hideOnMobile: true,
      cell: (v) => v.phone ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: "email",
      header: "Email",
      hideOnMobile: true,
      cell: (v) => v.email ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: "isActive",
      header: "Status",
      cell: (v) => <StatusPill status={v.isActive ? "active" : "inactive"} dot />,
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title="Vendors"
        description="Vendor master data."
        actions={
          hasPermission(PermissionKeys.vendorsManage) ? (
            <Button asChild size="md">
              <Link href="/vendors/new">
                <Plus className="h-4 w-4" />
                Add vendor
              </Link>
            </Button>
          ) : null
        }
      />

      <ListPageKpiBand
        loading={metaTotals.isLoading}
        columns={3}
        items={[
          {
            key: "total",
            label: "Total vendors",
            value: metaTotals.total ?? 0,
            icon: Building2,
            tone: "violet",
          },
          {
            key: "active",
            label: "Active",
            value: metaTotals.active ?? 0,
            icon: UserCheck,
            tone: "green",
          },
          {
            key: "inactive",
            label: "Inactive",
            value: metaTotals.inactive ?? 0,
            icon: Building2,
            tone: "neutral",
          },
        ]}
      />

      <ListToolbar
        search={list.search}
        onSearchChange={(v) => {
          list.patch({ search: v, page: 1 });
        }}
        searchPlaceholder="Search vendor name…"
        filters={
          <FilterSelect
            aria-label="Status filter"
            value={activeFilter === "all" ? "" : activeFilter}
            onChange={(v) => {
              list.patch({ extras: { active: v || "all" }, page: 1 });
            }}
            placeholder="All statuses"
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Archived" },
            ]}
          />
        }
      />

      {isError ? (
        <Card className="p-4 text-sm text-destructive">
          {error instanceof ApiClientError ? error.message : "Failed to load vendors."}{" "}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <DataTable
          tableId="vendors"
          sortMode="server"
          serverSort={sortParams}
          onServerSortChange={list.onServerSortChange}
          data={rows}
          columns={columns}
          getRowId={(v) => v.vendorId}
          loading={isLoading}
          caption="Vendor directory"
          onRowClick={(v) => router.push(`/vendors/${v.vendorId}`)}
          empty={
            <EmptyState
              icon={Building2}
              title="No vendors found"
              description="Adjust filters or add a new vendor."
            />
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
            itemLabel="vendors"
          />
        </div>
      </Card>
    </div>
  );
}

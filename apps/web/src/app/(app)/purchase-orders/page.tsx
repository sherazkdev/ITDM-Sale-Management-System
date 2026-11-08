"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Plus } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Pagination } from "@/components/common/Pagination";
import { StatusPill } from "@/components/common/StatusPill";
import { EmptyState } from "@/components/common/EmptyState";
import { ListToolbar } from "@/components/crud/ListToolbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchPurchaseOrders, type PurchaseOrder } from "@/lib/api/purchase-orders";
import { useServerListTable } from "@/lib/hooks/use-server-list-table";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { ApiClientError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { PO_STATUS_LABELS, poStatusToPill } from "@/lib/domain/purchase-order-ui";

const PO_LIST_DEFAULTS = { page: 1, pageSize: 20, sortDir: "desc" as const };

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const list = useServerListTable({ defaults: PO_LIST_DEFAULTS, defaultSortBy: "purchaseOrderId" });

  const sortParams = useMemo(
    () => ({
      sortBy: list.sortBy || "purchaseOrderId",
      sortDir: list.sortDir,
    }),
    [list.sortBy, list.sortDir],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "purchase-orders",
      list.page,
      list.pageSize,
      list.debouncedSearch,
      sortParams.sortBy,
      sortParams.sortDir,
    ],
    queryFn: () =>
      fetchPurchaseOrders({
        page: list.page,
        pageSize: list.pageSize,
        search: list.debouncedSearch || undefined,
        sortBy: sortParams.sortBy,
        sortDir: sortParams.sortDir,
      }),
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / list.pageSize));

  const columns: Column<PurchaseOrder>[] = [
    {
      key: "poNumber",
      header: "PO number",
      sortable: true,
      serverSortKey: "poNumber",
      cell: (po) => <span className="font-medium tabular">{po.poNumber}</span>,
    },
    {
      key: "vendor",
      header: "Vendor",
      cell: (po) => po.vendor?.vendorName ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      serverSortKey: "status",
      cell: (po) => (
        <StatusPill status={poStatusToPill(po.status)} label={PO_STATUS_LABELS[po.status] ?? po.status} dot />
      ),
    },
    {
      key: "totalAmount",
      header: "Total",
      sortable: true,
      serverSortKey: "totalAmount",
      cell: (po) => formatCurrency(Number(po.totalAmount), po.currency),
    },
    {
      key: "poDate",
      header: "Date",
      hideOnMobile: true,
      sortable: true,
      serverSortKey: "poDate",
      cell: (po) => po.poDate,
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title="Purchase orders"
        description="PO drafts, lines, and procurement."
        actions={
          hasPermission(PermissionKeys.purchaseOrdersManage) ? (
            <Button asChild size="md">
              <Link href="/purchase-orders/new">
                <Plus className="h-4 w-4" />
                New draft
              </Link>
            </Button>
          ) : null
        }
      />

      <ListToolbar
        search={list.search}
        onSearchChange={(v) => {
          list.patch({ search: v, page: 1 });
        }}
        searchPlaceholder="Search PO number…"
      />

      {isError ? (
        <Card className="p-4 text-sm text-destructive">
          {error instanceof ApiClientError ? error.message : "Failed to load purchase orders."}{" "}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <DataTable
          tableId="purchase-orders"
          sortMode="server"
          serverSort={sortParams}
          onServerSortChange={list.onServerSortChange}
          data={rows}
          columns={columns}
          getRowId={(po) => po.purchaseOrderId}
          loading={isLoading}
          caption="Purchase order register"
          onRowClick={(po) => router.push(`/purchase-orders/${po.purchaseOrderId}`)}
          empty={
            <EmptyState
              icon={FileText}
              title="No purchase orders found"
              description="Adjust search or create a new draft."
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
            itemLabel="purchase orders"
          />
        </div>
      </Card>
    </div>
  );
}

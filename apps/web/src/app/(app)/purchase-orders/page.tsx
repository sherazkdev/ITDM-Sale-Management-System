"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { ApiClientError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { PO_STATUS_LABELS, poStatusToPill } from "@/lib/domain/purchase-order-ui";

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["purchase-orders", page, pageSize, debouncedSearch],
    queryFn: () =>
      fetchPurchaseOrders({
        page,
        pageSize,
        search: debouncedSearch || undefined,
      }),
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns: Column<PurchaseOrder>[] = [
    {
      key: "poNumber",
      header: "PO number",
      sortable: true,
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
      cell: (po) => (
        <StatusPill status={poStatusToPill(po.status)} label={PO_STATUS_LABELS[po.status] ?? po.status} dot />
      ),
    },
    {
      key: "totalAmount",
      header: "Total",
      cell: (po) => formatCurrency(Number(po.totalAmount), po.currency),
    },
    {
      key: "poDate",
      header: "Date",
      hideOnMobile: true,
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
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
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
          data={rows}
          columns={columns}
          getRowId={(po) => po.purchaseOrderId}
          loading={isLoading}
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
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
            itemLabel="purchase orders"
          />
        </div>
      </Card>
    </div>
  );
}

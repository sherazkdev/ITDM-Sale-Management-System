"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Receipt } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Pagination } from "@/components/common/Pagination";
import { StatusPill } from "@/components/common/StatusPill";
import { EmptyState } from "@/components/common/EmptyState";
import { ListToolbar } from "@/components/crud/ListToolbar";
import { FilterSelect } from "@/components/common/FilterSelect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchInvoices, type Invoice } from "@/lib/api/invoices";
import { useServerListTable } from "@/lib/hooks/use-server-list-table";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { ApiClientError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { INVOICE_PAYMENT_LABELS, invoicePaymentToPill } from "@/lib/domain/invoice-ui";
import { ReportListExportMenu } from "@/components/data-management/ReportListExportMenu";

const PAYMENT_STATUS_OPTIONS = [
  { value: "UNPAID", label: "Unpaid" },
  { value: "PARTIAL", label: "Partially paid" },
  { value: "PAID", label: "Paid" },
];

const INVOICE_LIST_DEFAULTS = { page: 1, pageSize: 20, paymentStatus: "", sortDir: "desc" as const };

export default function InvoicesPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const list = useServerListTable({ defaults: INVOICE_LIST_DEFAULTS, defaultSortBy: "invoiceId" });
  const paymentStatus = list.extras.paymentStatus ?? "";

  const sortParams = useMemo(
    () => ({
      sortBy: list.sortBy || "invoiceId",
      sortDir: list.sortDir,
    }),
    [list.sortBy, list.sortDir],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "invoices",
      list.page,
      list.pageSize,
      list.debouncedSearch,
      paymentStatus,
      sortParams.sortBy,
      sortParams.sortDir,
    ],
    queryFn: () =>
      fetchInvoices({
        page: list.page,
        pageSize: list.pageSize,
        search: list.debouncedSearch || undefined,
        paymentStatus: paymentStatus || undefined,
        sortBy: sortParams.sortBy,
        sortDir: sortParams.sortDir,
      }),
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / list.pageSize));

  const columns: Column<Invoice>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice #",
      sortable: true,
      serverSortKey: "invoiceNumber",
      cell: (row) => <span className="font-medium tabular">{row.invoiceNumber}</span>,
    },
    {
      key: "po",
      header: "PO",
      cell: (row) => row.purchaseOrder?.poNumber ?? "—",
    },
    {
      key: "invoiceDate",
      header: "Date",
      hideOnMobile: true,
      sortable: true,
      serverSortKey: "invoiceDate",
      cell: (row) => row.invoiceDate?.slice(0, 10) ?? row.invoiceDate,
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) =>
        formatCurrency(Number(row.invoiceAmount), row.purchaseOrder?.currency ?? "USD"),
    },
    {
      key: "status",
      header: "Payment",
      sortable: true,
      serverSortKey: "paymentStatus",
      cell: (row) => (
        <StatusPill
          status={invoicePaymentToPill(row.paymentStatus)}
          label={INVOICE_PAYMENT_LABELS[row.paymentStatus] ?? row.paymentStatus}
          dot
        />
      ),
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title="Invoices & payments"
        description="Invoice register, balances, and payment history."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {hasPermission(PermissionKeys.reportsRead) ? (
              <ReportListExportMenu
                listKey="invoices"
                filterParams={{
                  paymentStatus: list.extras.paymentStatus || undefined,
                  search: list.debouncedSearch || undefined,
                }}
              />
            ) : null}
            {hasPermission(PermissionKeys.invoicesManage) ? (
              <Button asChild size="md">
                <Link href="/invoices/new">
                  <Plus className="h-4 w-4" />
                  New invoice
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <ListToolbar
        search={list.search}
        onSearchChange={(value) => {
          list.patch({ search: value, page: 1 });
        }}
        searchPlaceholder="Search invoice # or PO number…"
        filters={
          <FilterSelect
            value={paymentStatus}
            onChange={(value) => {
              list.patch({ extras: { paymentStatus: value }, page: 1 });
            }}
            placeholder="All payment statuses"
            options={PAYMENT_STATUS_OPTIONS}
            aria-label="Filter by payment status"
            className="w-full sm:w-48"
          />
        }
      />

      {isError ? (
        <Card className="p-4 text-sm text-destructive">
          {error instanceof ApiClientError ? error.message : "Failed to load invoices."}{" "}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <DataTable
          tableId="invoices"
          sortMode="server"
          serverSort={sortParams}
          onServerSortChange={list.onServerSortChange}
          data={rows}
          columns={columns}
          getRowId={(row) => row.invoiceId}
          loading={isLoading}
          caption="Invoice register"
          onRowClick={(row) => router.push(`/invoices/${row.invoiceId}`)}
          empty={
            <EmptyState
              icon={Receipt}
              title={list.debouncedSearch || paymentStatus ? "No matching invoices" : "No invoices yet"}
              description={
                list.debouncedSearch || paymentStatus
                  ? "Try a different search or payment status filter."
                  : "Create an invoice linked to a purchase order."
              }
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
            itemLabel="invoices"
          />
        </div>
      </Card>
    </div>
  );
}

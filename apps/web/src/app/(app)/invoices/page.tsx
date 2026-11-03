"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Receipt } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Pagination } from "@/components/common/Pagination";
import { StatusPill } from "@/components/common/StatusPill";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchInvoices, type Invoice } from "@/lib/api/invoices";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { ApiClientError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { INVOICE_PAYMENT_LABELS, invoicePaymentToPill } from "@/lib/domain/invoice-ui";

export default function InvoicesPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["invoices", page, pageSize],
    queryFn: () => fetchInvoices({ page, pageSize }),
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns: Column<Invoice>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice #",
      sortable: true,
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
          hasPermission(PermissionKeys.invoicesManage) ? (
            <Button asChild size="md">
              <Link href="/invoices/new">
                <Plus className="h-4 w-4" />
                New invoice
              </Link>
            </Button>
          ) : null
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
          data={rows}
          columns={columns}
          getRowId={(row) => row.invoiceId}
          loading={isLoading}
          onRowClick={(row) => router.push(`/invoices/${row.invoiceId}`)}
          empty={
            <EmptyState
              icon={Receipt}
              title="No invoices yet"
              description="Create an invoice linked to a purchase order."
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
            itemLabel="invoices"
          />
        </div>
      </Card>
    </div>
  );
}

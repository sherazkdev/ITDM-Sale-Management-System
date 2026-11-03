"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { QuickTip } from "@/components/common/QuickTip";
import { BudgetProvisionalNotice } from "@/components/finance/BudgetProvisionalNotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { searchPurchaseOrder, type PoSearchResult } from "@/lib/api/search";
import { downloadDocument } from "@/lib/api/documents";
import { ApiClientError } from "@/lib/api/client";
import { PO_SEARCH_SCOPE_NOTE } from "@/lib/domain/export-ui";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground break-words">{value}</dd>
    </div>
  );
}

function DocumentList({
  docs,
  canDownload,
}: {
  docs: PoSearchResult["supportingDocuments"]["purchaseOrder"];
  canDownload: boolean;
}) {
  if (docs.length === 0) {
    return <p className="text-sm text-muted-foreground">No linked documents.</p>;
  }
  return (
    <ul className="space-y-2">
      {docs.map((doc) => (
        <li key={doc.storedDocumentId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="min-w-0 truncate">{doc.originalFileName}</span>
          {canDownload ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                downloadDocument(doc.storedDocumentId, doc.originalFileName).catch((err) => {
                  const message = err instanceof ApiClientError ? err.message : "Download failed";
                  toast.error(message);
                })
              }
            >
              Download
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">No document access</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function GlobalSearchPage() {
  const searchParams = useSearchParams();
  const initialPo = searchParams.get("po") ?? "";
  const [query, setQuery] = useState(initialPo);
  const [submittedPo, setSubmittedPo] = useState(initialPo.trim());

  const { hasPermission } = useAuth();
  const canInvoices = hasPermission(PermissionKeys.invoicesRead);
  const canBudgets = hasPermission(PermissionKeys.budgetsRead);
  const canAssetFinancials = hasPermission(PermissionKeys.assetsFinancialsRead);
  const canDocuments = hasPermission(PermissionKeys.documentsRead);

  const searchQuery = useQuery({
    queryKey: ["po-search", submittedPo],
    queryFn: () => searchPurchaseOrder(submittedPo),
    enabled: Boolean(submittedPo),
    retry: (count, err) => {
      if (err instanceof ApiClientError && (err.status === 404 || err.status === 403)) return false;
      return count < 2;
    },
  });

  const po = searchQuery.data?.purchaseOrder;
  const currency = po?.currency ?? "USD";

  const lineColumns: Column<PoSearchResult["purchaseOrder"]["lines"][number]>[] = [
    { key: "line", header: "#", cell: (r) => r.lineNumber },
    { key: "desc", header: "Description", cell: (r) => r.description },
    { key: "qty", header: "Qty", cell: (r) => r.quantity },
    { key: "unit", header: "Unit", cell: (r) => formatCurrency(Number(r.unitPrice), currency) },
    { key: "total", header: "Line total", cell: (r) => formatCurrency(Number(r.lineTotal), currency) },
  ];

  const assetColumns: Column<PoSearchResult["purchaseOrder"]["assets"][number]>[] = [
    {
      key: "code",
      header: "Asset",
      cell: (r) => (
        <Link href={`/assets/${r.assetId}`} className="font-medium text-primary hover:underline">
          {r.assetCode}
        </Link>
      ),
    },
    { key: "name", header: "Name", cell: (r) => r.assetName },
    { key: "status", header: "Status", cell: (r) => r.status },
    ...(canAssetFinancials
      ? [
          {
            key: "price",
            header: "Purchase price",
            cell: (r: PoSearchResult["purchaseOrder"]["assets"][number]) =>
              r.purchasePrice ? formatCurrency(Number(r.purchasePrice), currency) : "—",
          } as Column<PoSearchResult["purchaseOrder"]["assets"][number]>,
        ]
      : []),
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title="Global search"
        description="Purchase order interconnected lookup — vendor, contract, assets, finance, documents, and alerts."
      />

      <QuickTip title="Search scope">{PO_SEARCH_SCOPE_NOTE}</QuickTip>

      <SectionCard title="Find purchase order">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmittedPo(query.trim());
          }}
        >
          <div className="flex-1 min-w-0">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="po-search">
              PO number
            </label>
            <Input
              id="po-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. PO-2026-001"
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Button type="submit" disabled={!query.trim()}>
            Search
          </Button>
        </form>
      </SectionCard>

      {!submittedPo && (
        <EmptyState
          icon={Search}
          title="Enter a PO number"
          description="Results include related vendor, contract, line items, and linked records when present."
        />
      )}

      {submittedPo && searchQuery.isLoading && (
        <p className="text-sm text-muted-foreground">Loading PO hub…</p>
      )}

      {searchQuery.isError && (
        <EmptyState
          icon={Search}
          title="No results"
          description={
            searchQuery.error instanceof ApiClientError
              ? searchQuery.error.message
              : "Search failed — try again."
          }
        />
      )}

      {searchQuery.data && po && (
        <>
          <SectionCard title={`PO ${po.poNumber}`}>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailField
                label="Vendor"
                value={
                  po.vendor ? (
                    <Link href={`/vendors/${po.vendor.vendorId}`} className="text-primary hover:underline">
                      {po.vendor.vendorName}
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
              <DetailField
                label="Contract"
                value={
                  po.contract ? (
                    <Link href={`/contracts/${po.contract.contractId}`} className="text-primary hover:underline">
                      {po.contract.contractNumber}
                    </Link>
                  ) : (
                    "No contract linked"
                  )
                }
              />
              <DetailField
                label="Status"
                value={
                  <Link href={`/purchase-orders/${po.purchaseOrderId}`} className="text-primary hover:underline">
                    {po.status} — open PO
                  </Link>
                }
              />
              <DetailField label="PO date" value={po.poDate} />
              <DetailField label="Currency" value={po.currency} />
              <DetailField
                label="PO valid until"
                value={searchQuery.data.expiryDates.poValidUntil ?? "Not set"}
              />
              <DetailField
                label="Contract expiry"
                value={searchQuery.data.expiryDates.contractExpiry ?? "Not set"}
              />
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">{searchQuery.data.expiryDates.note}</p>
          </SectionCard>

          <Tabs defaultValue="lines" className="space-y-4">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="lines">Line items</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="movements">Issuance / returns</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="licenses">Licenses</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              {canInvoices && <TabsTrigger value="invoices">Invoices</TabsTrigger>}
              {canBudgets && <TabsTrigger value="budget">Budget</TabsTrigger>}
            </TabsList>

            <TabsContent value="lines">
              <SectionCard title="PO line items">
                <DataTable
                  columns={lineColumns}
                  data={po.lines}
                  getRowId={(r) => r.purchaseOrderLineId}
                  empty={<p className="text-sm text-muted-foreground p-4">No lines on this PO.</p>}
                />
              </SectionCard>
            </TabsContent>

            <TabsContent value="assets">
              <SectionCard title="Assets on PO">
                <DataTable
                  columns={assetColumns}
                  data={po.assets}
                  getRowId={(r) => r.assetId}
                  empty={<p className="text-sm text-muted-foreground p-4">No assets linked.</p>}
                />
              </SectionCard>
            </TabsContent>

            <TabsContent value="movements">
              <SectionCard title="Issuance and return history">
                {searchQuery.data.movements.length >= searchQuery.data.truncation.movementsCap && (
                  <p className="mb-2 text-xs text-amber-700 dark:text-amber-400">
                    Showing first {searchQuery.data.truncation.movementsCap} movements.
                  </p>
                )}
                <DataTable
                  columns={[
                    { key: "date", header: "Date", cell: (r) => r.transactionDate },
                    { key: "type", header: "Type", cell: (r) => r.transactionType },
                    {
                      key: "asset",
                      header: "Asset",
                      cell: (r) => (r.asset ? `${r.asset.assetCode} — ${r.asset.assetName}` : "—"),
                    },
                    {
                      key: "employee",
                      header: "Employee",
                      cell: (r) => (r.employee ? `${r.employee.employeeCode} — ${r.employee.fullName}` : "—"),
                    },
                  ]}
                  data={searchQuery.data.movements}
                  getRowId={(r) => r.assetTransactionId}
                  empty={
                    <p className="text-sm text-muted-foreground p-4">No movement history for PO assets.</p>
                  }
                />
              </SectionCard>
            </TabsContent>

            <TabsContent value="maintenance">
              <SectionCard title="Maintenance">
                <DataTable
                  columns={[
                    {
                      key: "id",
                      header: "Record",
                      cell: (r) => (
                        <Link href={`/maintenance/${r.maintenanceRecordId}`} className="text-primary hover:underline">
                          {r.maintenanceType}
                        </Link>
                      ),
                    },
                    { key: "status", header: "Status", cell: (r) => r.status },
                    { key: "scheduled", header: "Scheduled", cell: (r) => r.scheduledDate ?? "—" },
                    { key: "completed", header: "Completed", cell: (r) => r.completedDate ?? "—" },
                  ]}
                  data={searchQuery.data.maintenance}
                  getRowId={(r) => r.maintenanceRecordId}
                  empty={<p className="text-sm text-muted-foreground p-4">No maintenance records linked.</p>}
                />
              </SectionCard>
            </TabsContent>

            <TabsContent value="licenses">
              <SectionCard title="Software licenses">
                <DataTable
                  columns={[
                    {
                      key: "product",
                      header: "Product",
                      cell: (r) => (
                        <Link href={`/software-licenses/${r.licenseId}`} className="text-primary hover:underline">
                          {r.productName}
                        </Link>
                      ),
                    },
                    { key: "status", header: "Status", cell: (r) => r.status },
                    { key: "expiry", header: "Expiry", cell: (r) => r.expiryDate ?? "—" },
                  ]}
                  data={searchQuery.data.softwareLicenses}
                  getRowId={(r) => r.licenseId}
                  empty={<p className="text-sm text-muted-foreground p-4">No licenses on this PO.</p>}
                />
              </SectionCard>
            </TabsContent>

            <TabsContent value="documents">
              <SectionCard title="Linked documents">
                <h4 className="text-sm font-medium mb-2">Purchase order</h4>
                <DocumentList docs={searchQuery.data.supportingDocuments.purchaseOrder} canDownload={canDocuments} />
                <h4 className="text-sm font-medium mt-4 mb-2">Contract</h4>
                <DocumentList docs={searchQuery.data.supportingDocuments.contract} canDownload={canDocuments} />
              </SectionCard>
            </TabsContent>

            {canInvoices && (
              <TabsContent value="invoices">
                <SectionCard title="Invoices and payments">
                  <DataTable
                    columns={[
                      {
                        key: "num",
                        header: "Invoice",
                        cell: (r) => (
                          <Link href={`/invoices/${r.invoiceId}`} className="text-primary hover:underline">
                            {r.invoiceNumber}
                          </Link>
                        ),
                      },
                      { key: "amount", header: "Amount", cell: (r) => formatCurrency(Number(r.invoiceAmount), currency) },
                      { key: "paid", header: "Paid", cell: (r) => formatCurrency(Number(r.paidTotal), currency) },
                      {
                        key: "out",
                        header: "Outstanding",
                        cell: (r) => formatCurrency(Number(r.outstanding), currency),
                      },
                      { key: "status", header: "Status", cell: (r) => r.paymentStatus },
                    ]}
                    data={searchQuery.data.invoiceFinancials}
                    getRowId={(r) => r.invoiceId}
                    empty={<p className="text-sm text-muted-foreground p-4">No invoices on this PO.</p>}
                  />
                </SectionCard>
              </TabsContent>
            )}

            {canBudgets && (
              <TabsContent value="budget">
                <SectionCard title="Budget (provisional)">
                  <BudgetProvisionalNotice message={searchQuery.data.budget.semanticsNote} />
                  <div className="mt-4">
                    <DataTable
                      columns={[
                        { key: "year", header: "Year", cell: (r) => r.yearName },
                        { key: "cat", header: "Category", cell: (r) => r.budgetCategory },
                        {
                          key: "alloc",
                          header: "Allocated",
                          cell: (r) => formatCurrency(Number(r.allocatedAmount), r.currency),
                        },
                        {
                          key: "ledger",
                          header: "Ledger total",
                          cell: (r) => formatCurrency(Number(r.ledgerTotal), r.currency),
                        },
                        {
                          key: "rem",
                          header: "Remaining (provisional)",
                          cell: (r) => formatCurrency(Number(r.remainingProvisional), r.currency),
                        },
                      ]}
                      data={searchQuery.data.budget.allocations}
                      getRowId={(r) => r.budgetId}
                      empty={
                        <p className="text-sm text-muted-foreground p-4">No budget ledger entries for this PO.</p>
                      }
                    />
                  </div>
                </SectionCard>
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
}

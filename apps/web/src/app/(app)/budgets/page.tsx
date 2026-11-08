"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { FilterSelect } from "@/components/common/FilterSelect";
import { BudgetProvisionalNotice } from "@/components/finance/BudgetProvisionalNotice";
import { ConfirmDialog } from "@/components/crud/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import {
  appendBudgetLedgerEntry,
  correctBudgetAllocation,
  createBudgetAllocation,
  createFinancialYear,
  fetchBudgetAllocations,
  fetchBudgetByPurchaseOrder,
  fetchBudgetByVendor,
  fetchBudgetSummary,
  fetchFinancialYears,
  type BudgetAllocation,
  type BudgetSummary,
  type BudgetTransaction,
  type FinancialYear,
} from "@/lib/api/budgets";
import {
  appendLedgerEntrySchema,
  correctBudgetAllocationSchema,
  createBudgetAllocationSchema,
  createFinancialYearSchema,
  type AppendLedgerEntryInput,
  type CorrectBudgetAllocationInput,
  type CreateBudgetAllocationInput,
  type CreateFinancialYearInput,
} from "@/lib/validators/budget";
import { BUDGET_LEDGER_SEMANTICS } from "@/lib/domain/budget-ui";
import { ApiClientError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKeys.budgetsManage);
  const canAdminCorrect = hasPermission(PermissionKeys.financialCorrections);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [allocCorrectionOpen, setAllocCorrectionOpen] = useState(false);
  const [pendingAllocCorrection, setPendingAllocCorrection] =
    useState<CorrectBudgetAllocationInput | null>(null);
  const [summaryBudgetId, setSummaryBudgetId] = useState("");
  const [lookupPoId, setLookupPoId] = useState("");
  const [lookupVendorId, setLookupVendorId] = useState("");

  const yearsQuery = useQuery({
    queryKey: ["financial-years"],
    queryFn: fetchFinancialYears,
  });

  const allocationsQuery = useQuery({
    queryKey: ["budget-allocations", selectedYearId],
    queryFn: () => fetchBudgetAllocations(selectedYearId || undefined),
  });

  const summaryQuery = useQuery({
    queryKey: ["budget-summary", summaryBudgetId],
    queryFn: () => fetchBudgetSummary(summaryBudgetId),
    enabled: Boolean(summaryBudgetId),
  });

  const byPoQuery = useQuery({
    queryKey: ["budget-by-po", lookupPoId],
    queryFn: () => fetchBudgetByPurchaseOrder(lookupPoId),
    enabled: Boolean(lookupPoId.trim()),
  });

  const byVendorQuery = useQuery({
    queryKey: ["budget-by-vendor", lookupVendorId],
    queryFn: () => fetchBudgetByVendor(lookupVendorId),
    enabled: Boolean(lookupVendorId.trim()),
  });

  const years = yearsQuery.data ?? [];
  const allocations = allocationsQuery.data ?? [];
  const summary = summaryQuery.data;

  const yearForm = useForm<CreateFinancialYearInput>({
    resolver: zodResolver(createFinancialYearSchema),
    defaultValues: { yearName: "", startDate: "", endDate: "", status: "OPEN" },
  });

  const allocForm = useForm<CreateBudgetAllocationInput>({
    resolver: zodResolver(createBudgetAllocationSchema),
    defaultValues: {
      financialYearId: "",
      budgetCategory: "",
      allocatedAmount: undefined,
      currency: "USD",
    },
  });

  const ledgerForm = useForm<AppendLedgerEntryInput>({
    resolver: zodResolver(appendLedgerEntrySchema),
    defaultValues: {
      correctionReason: "",
      budgetId: "",
      transactionType: "MANUAL",
      amount: undefined,
      transactionDate: "",
      purchaseOrderId: "",
      invoiceId: "",
      remarks: "",
    },
  });

  const allocCorrectionMutation = useMutation({
    mutationFn: (values: CorrectBudgetAllocationInput) =>
      correctBudgetAllocation(summaryBudgetId, values),
    onSuccess: () => {
      setAllocCorrectionOpen(false);
      setPendingAllocCorrection(null);
      toast.success("Allocation corrected");
      void queryClient.invalidateQueries({ queryKey: ["budget-allocations"] });
      void queryClient.invalidateQueries({ queryKey: ["budget-summary", summaryBudgetId] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Allocation correction failed"),
  });

  const createYearMutation = useMutation({
    mutationFn: createFinancialYear,
    onSuccess: () => {
      toast.success("Financial year created");
      yearForm.reset({ yearName: "", startDate: "", endDate: "", status: "OPEN" });
      void queryClient.invalidateQueries({ queryKey: ["financial-years"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Failed to create year"),
  });

  const createAllocMutation = useMutation({
    mutationFn: createBudgetAllocation,
    onSuccess: () => {
      toast.success("Allocation created");
      allocForm.reset({
        financialYearId: selectedYearId,
        budgetCategory: "",
        allocatedAmount: undefined,
        currency: "USD",
      });
      void queryClient.invalidateQueries({ queryKey: ["budget-allocations"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Failed to create allocation"),
  });

  const ledgerMutation = useMutation({
    mutationFn: appendBudgetLedgerEntry,
    onSuccess: () => {
      toast.success("Ledger entry added");
      ledgerForm.reset({
        correctionReason: "",
        budgetId: summaryBudgetId,
        transactionType: "MANUAL",
        amount: undefined,
        transactionDate: "",
        purchaseOrderId: "",
        invoiceId: "",
        remarks: "",
      });
      void queryClient.invalidateQueries({ queryKey: ["budget-summary", summaryBudgetId] });
      void queryClient.invalidateQueries({ queryKey: ["budget-allocations"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Failed to add ledger entry"),
  });

  const yearColumns: Column<FinancialYear>[] = [
    { key: "name", header: "Year", cell: (y) => y.yearName },
    { key: "start", header: "Start", hideOnMobile: true, cell: (y) => y.startDate?.slice(0, 10) },
    { key: "end", header: "End", hideOnMobile: true, cell: (y) => y.endDate?.slice(0, 10) },
    { key: "status", header: "Status", cell: (y) => y.status },
  ];

  const allocColumns: Column<BudgetAllocation>[] = [
    { key: "cat", header: "Category", cell: (a) => a.budgetCategory },
    {
      key: "allocated",
      header: "Allocated",
      cell: (a) => formatCurrency(Number(a.allocatedAmount), a.currency),
    },
    {
      key: "id",
      header: "Budget ID",
      hideOnMobile: true,
      cell: (a) => (
        <button
          type="button"
          className="text-primary hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            setSummaryBudgetId(a.budgetId);
          }}
        >
          {a.budgetId}
        </button>
      ),
    },
  ];

  const yearOptions = years.map((y: FinancialYear) => ({ value: y.financialYearId, label: y.yearName }));

  return (
    <div className="page-stack">
      <PageHeader title="Annual budgets" description="Financial years, allocations, and ledger entries." />

      <BudgetProvisionalNotice />

      <Tabs defaultValue="years" className="w-full">
        <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="years">Financial years</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="summary">Summary & ledger</TabsTrigger>
          <TabsTrigger value="lookups">PO & vendor lookups</TabsTrigger>
        </TabsList>

        <TabsContent value="years" className="mt-0">
      <SectionCard title="Financial years">
        <DataTable
          tableId="budget-financial-years"
          sortMode="client"
          data={years}
          columns={yearColumns}
          getRowId={(y) => y.financialYearId}
          loading={yearsQuery.isLoading}
          onRowClick={(y) => setSelectedYearId(y.financialYearId)}
          empty={<p className="p-4 text-sm text-muted-foreground">No financial years yet.</p>}
        />
        {canManage ? (
          <form
            className="mt-4 grid gap-3 border-t border-border pt-4 md:grid-cols-2 lg:grid-cols-5"
            onSubmit={yearForm.handleSubmit((v) => createYearMutation.mutate(v))}
          >
            <Input placeholder="Year name" {...yearForm.register("yearName")} />
            <Input type="date" {...yearForm.register("startDate")} />
            <Input type="date" {...yearForm.register("endDate")} />
            <Input placeholder="Status" {...yearForm.register("status")} />
            <Button type="submit" size="md" disabled={createYearMutation.isPending}>
              <Plus className="h-4 w-4" />
              Add year
            </Button>
          </form>
        ) : null}
      </SectionCard>
        </TabsContent>

        <TabsContent value="allocations" className="mt-0">
      <SectionCard title="Budget allocations">
        <div className="mb-4 max-w-md">
          <FilterSelect
            value={selectedYearId}
            onChange={setSelectedYearId}
            options={[{ value: "", label: "All years" }, ...yearOptions]}
            placeholder="Filter by financial year"
          />
        </div>
        <DataTable
          tableId="budget-allocations"
          sortMode="client"
          data={allocations}
          columns={allocColumns}
          getRowId={(a) => a.budgetId}
          loading={allocationsQuery.isLoading}
          empty={
            <EmptyBudget icon={Wallet} message="No allocations for this filter." />
          }
        />
        {canManage ? (
          <form
            className="mt-4 grid gap-3 border-t border-border pt-4 md:grid-cols-2 lg:grid-cols-5"
            onSubmit={allocForm.handleSubmit((v) => createAllocMutation.mutate(v))}
          >
            <Controller
              control={allocForm.control}
              name="financialYearId"
              render={({ field }) => (
                <FilterSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={yearOptions}
                  placeholder="Financial year"
                />
              )}
            />
            <Input placeholder="Category" {...allocForm.register("budgetCategory")} />
            <Input type="number" step="0.01" placeholder="Allocated" {...allocForm.register("allocatedAmount")} />
            <Input placeholder="Currency" maxLength={3} {...allocForm.register("currency")} />
            <Button type="submit" size="md" disabled={createAllocMutation.isPending}>
              Add allocation
            </Button>
          </form>
        ) : null}
      </SectionCard>
        </TabsContent>

        <TabsContent value="summary" className="mt-0 space-y-6">
      {summaryBudgetId ? (
        <SectionCard title={`Budget summary · ${summaryBudgetId}`}>
          {summaryQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading summary…</p>
          ) : summary ? (
            <BudgetSummaryView summary={summary} />
          ) : null}
        </SectionCard>
      ) : (
        <SectionCard title="Budget summary">
          <p className="text-sm text-muted-foreground">
            Select a budget ID from the Allocations tab to load committed, actual paid, and ledger detail here.
          </p>
        </SectionCard>
      )}

      {canAdminCorrect && summaryBudgetId ? (
        <SectionCard
          title="Admin allocation correction"
          description="Adjust USD allocation metadata. Utilized/actual rows are driven by invoice post and payment — not edited here."
        >
          <form
            className="grid w-full max-w-none gap-3 md:grid-cols-2 lg:max-w-3xl"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const parsed = correctBudgetAllocationSchema.safeParse({
                correctionReason: String(fd.get("allocCorrectionReason") ?? ""),
                budgetCategory: String(fd.get("allocCategory") ?? ""),
                allocatedAmount:
                  String(fd.get("allocAmount") ?? "") === ""
                    ? undefined
                    : Number(fd.get("allocAmount")),
              });
              if (!parsed.success) {
                toast.error(parsed.error.errors[0]?.message ?? "Invalid correction");
                return;
              }
              setPendingAllocCorrection(parsed.data);
              setAllocCorrectionOpen(true);
            }}
          >
            <Input
              name="allocCorrectionReason"
              placeholder="Correction reason (required)"
              className="md:col-span-2"
            />
            <Input name="allocCategory" placeholder="Category (optional)" />
            <Input name="allocAmount" type="number" step="0.01" placeholder="Allocated USD (optional)" />
            <Button type="submit" variant="secondary" className="md:col-span-2">
              Review allocation correction
            </Button>
          </form>
          <ConfirmDialog
            open={allocCorrectionOpen}
            onOpenChange={setAllocCorrectionOpen}
            title="Confirm allocation correction"
            description={
              pendingAllocCorrection
                ? pendingAllocCorrection.correctionReason
                : "Confirm correction"
            }
            confirmLabel="Apply correction"
            loading={allocCorrectionMutation.isPending}
            onConfirm={() => {
              if (pendingAllocCorrection) allocCorrectionMutation.mutate(pendingAllocCorrection);
            }}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            <Link href="/admin/audit" className="text-primary hover:underline">
              Audit log
            </Link>{" "}
            records before/after values for each correction.
          </p>
        </SectionCard>
      ) : null}

      {canAdminCorrect && summaryBudgetId ? (
        <SectionCard title="Admin manual ledger entry">
          <p className="mb-3 text-xs text-muted-foreground">{BUDGET_LEDGER_SEMANTICS}</p>
          <form
            className="grid w-full max-w-none gap-3 md:grid-cols-2 lg:max-w-3xl"
            onSubmit={ledgerForm.handleSubmit((v) => ledgerMutation.mutate({ ...v, budgetId: summaryBudgetId }))}
          >
            <Input
              placeholder="Correction reason"
              className="md:col-span-2"
              {...ledgerForm.register("correctionReason")}
            />
            <Input placeholder="Transaction type" {...ledgerForm.register("transactionType")} />
            <Input type="number" step="0.01" placeholder="Amount" {...ledgerForm.register("amount")} />
            <Input type="date" {...ledgerForm.register("transactionDate")} />
            <Input placeholder="PO id (optional)" {...ledgerForm.register("purchaseOrderId")} />
            <Input placeholder="Invoice id (optional)" {...ledgerForm.register("invoiceId")} />
            <Input placeholder="Remarks" {...ledgerForm.register("remarks")} />
            <Button type="submit" className="md:col-span-2" disabled={ledgerMutation.isPending}>
              Append ledger entry
            </Button>
          </form>
        </SectionCard>
      ) : null}
        </TabsContent>

        <TabsContent value="lookups" className="mt-0 space-y-6">
      <SectionCard title="Budget by purchase order">
        <div className="flex flex-wrap gap-2">
          <Input
            className="max-w-md"
            placeholder="Purchase order ID"
            value={lookupPoId}
            onChange={(e) => setLookupPoId(e.target.value)}
          />
          <Button variant="outline" size="md" onClick={() => void byPoQuery.refetch()} disabled={!lookupPoId.trim()}>
            Load
          </Button>
          {lookupPoId ? (
            <Button variant="link" asChild className="h-auto px-0">
              <Link href={`/purchase-orders/${lookupPoId}`}>Open PO</Link>
            </Button>
          ) : null}
        </div>
        {byPoQuery.data ? (
          <p className="mt-2 text-xs text-muted-foreground">{byPoQuery.data.semanticsNote}</p>
        ) : null}
        {byPoQuery.data?.transactions?.length ? (
          <ul className="mt-3 space-y-1 text-sm">
            {byPoQuery.data.transactions.map((t: BudgetTransaction) => (
              <li key={t.budgetTransactionId}>
                {t.transactionDate?.slice(0, 10)} · {t.transactionType} ·{" "}
                {formatCurrency(Number(t.amount), "USD")}
              </li>
            ))}
          </ul>
        ) : byPoQuery.isFetched && lookupPoId ? (
          <p className="mt-2 text-sm text-muted-foreground">No ledger rows for this PO.</p>
        ) : null}
      </SectionCard>

      <SectionCard title="Budget by vendor">
        <div className="flex flex-wrap gap-2">
          <Input
            className="max-w-md"
            placeholder="Vendor ID"
            value={lookupVendorId}
            onChange={(e) => setLookupVendorId(e.target.value)}
          />
          <Button
            variant="outline"
            size="md"
            onClick={() => void byVendorQuery.refetch()}
            disabled={!lookupVendorId.trim()}
          >
            Load
          </Button>
          {lookupVendorId ? (
            <Button variant="link" asChild className="h-auto px-0">
              <Link href={`/vendors/${lookupVendorId}`}>Open vendor</Link>
            </Button>
          ) : null}
        </div>
        {byVendorQuery.data ? (
          <p className="mt-2 text-xs text-muted-foreground">{byVendorQuery.data.semanticsNote}</p>
        ) : null}
      </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyBudget({ icon: Icon, message }: { icon: typeof Wallet; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
      <Icon className="h-8 w-8 opacity-50" />
      {message}
    </div>
  );
}

function BudgetSummaryView({ summary }: { summary: BudgetSummary }) {
  const reporting = summary.reportingCurrency ?? "USD";
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{summary.semanticsNote}</p>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DetailField label="Category" value={summary.budgetCategory} />
        <DetailField
          label="Allocated"
          value={formatCurrency(Number(summary.allocatedAmount), summary.currency)}
        />
        <DetailField
          label={`Utilized (${reporting})`}
          value={formatCurrency(Number(summary.utilizedUsd ?? summary.committedUsd), reporting)}
        />
        <DetailField
          label={`Actual (${reporting})`}
          value={formatCurrency(Number(summary.actualPaidUsd), reporting)}
        />
        <DetailField
          label={`Remaining (${reporting})`}
          value={
            summary.remainingUsd !== null
              ? formatCurrency(Number(summary.remainingUsd), reporting)
              : "Provisional — USD allocation or FX required"
          }
        />
        {summary.utilizationPercent !== null ? (
          <DetailField label="Utilization %" value={`${summary.utilizationPercent}%`} />
        ) : null}
      </dl>
      {summary.committedUsdProvisional || summary.provisionalNote ? (
        <p className="text-xs text-muted-foreground">{summary.provisionalNote}</p>
      ) : null}
      {summary.transactions.length ? (
        <ul className="space-y-1 border-t border-border pt-3 text-sm">
          {summary.transactions.map((t) => (
            <li key={t.budgetTransactionId}>
              {t.transactionDate?.slice(0, 10)} · {t.transactionType} ·{" "}
              {formatCurrency(Number(t.amount), summary.currency)}
              {t.remarks ? ` — ${t.remarks}` : ""}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No ledger transactions yet.</p>
      )}
    </div>
  );
}

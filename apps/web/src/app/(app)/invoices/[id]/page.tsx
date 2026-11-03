"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import {
  DetailField,
  DetailRecordLayout,
  RecordOverviewCard,
} from "@/components/crud/DetailRecordLayout";
import { DataTable, type Column } from "@/components/common/DataTable";
import { FilterSelect } from "@/components/common/FilterSelect";
import { StatusPill } from "@/components/common/StatusPill";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { fetchBudgetAllocations } from "@/lib/api/budgets";
import {
  fetchInvoice,
  fetchInvoiceBalance,
  fetchInvoicePayments,
  postInvoice,
  recordInvoicePayment,
  type InvoicePayment,
} from "@/lib/api/invoices";
import { FINANCIAL_REPORTING_CURRENCY } from "@/lib/domain/budget-ui";
import {
  postInvoiceSchema,
  recordPaymentSchema,
  type PostInvoiceInput,
  type RecordPaymentInput,
} from "@/lib/validators/invoice";
import { ApiClientError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { INVOICE_PAYMENT_LABELS, invoicePaymentToPill } from "@/lib/domain/invoice-ui";

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKeys.invoicesManage);
  const idempotencyRef = useRef<string | null>(null);
  const [postBudgetId, setPostBudgetId] = useState("");
  const [commitmentRate, setCommitmentRate] = useState("");

  const invoiceQuery = useQuery({
    queryKey: ["invoices", id],
    queryFn: () => fetchInvoice(id),
  });

  const balanceQuery = useQuery({
    queryKey: ["invoices", id, "balance"],
    queryFn: () => fetchInvoiceBalance(id),
  });

  const paymentsQuery = useQuery({
    queryKey: ["invoices", id, "payments"],
    queryFn: () => fetchInvoicePayments(id),
  });

  const allocationsQuery = useQuery({
    queryKey: ["budget-allocations"],
    queryFn: () => fetchBudgetAllocations(),
    enabled: canManage && !invoiceQuery.data?.postedAt,
  });

  const invoice = invoiceQuery.data;
  const balance = balanceQuery.data;
  const payments = paymentsQuery.data ?? [];
  const currency = invoice?.currency ?? invoice?.purchaseOrder?.currency ?? "USD";
  const isPosted = Boolean(invoice?.postedAt);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecordPaymentInput>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: { amount: undefined, paidAt: "", referenceNumber: "", notes: "", exchangeRateToUsd: undefined },
  });

  const postMutation = useMutation({
    mutationFn: (values: PostInvoiceInput) =>
      postInvoice(id, {
        budgetId: values.budgetId,
        ...(values.commitmentExchangeRateToUsd !== undefined
          ? { commitmentExchangeRateToUsd: values.commitmentExchangeRateToUsd }
          : {}),
      }),
    onSuccess: () => {
      toast.success("Invoice posted to budget");
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Post failed");
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (values: RecordPaymentInput) => {
      if (!idempotencyRef.current) {
        idempotencyRef.current = crypto.randomUUID();
      }
      return recordInvoicePayment(id, values, idempotencyRef.current);
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      idempotencyRef.current = null;
      reset();
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (err) => {
      if (err instanceof ApiClientError && err.code !== "CONFLICT") {
        idempotencyRef.current = null;
      }
      toast.error(err instanceof ApiClientError ? err.message : "Payment failed");
    },
  });

  const paymentColumns: Column<InvoicePayment>[] = [
    {
      key: "paidAt",
      header: "Paid at",
      cell: (p) => new Date(p.paidAt).toLocaleString(),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (p) => formatCurrency(Number(p.amount), p.currency ?? currency),
    },
    {
      key: "usd",
      header: FINANCIAL_REPORTING_CURRENCY,
      hideOnMobile: true,
      cell: (p) =>
        p.amountUsd ? formatCurrency(Number(p.amountUsd), FINANCIAL_REPORTING_CURRENCY) : "—",
    },
    {
      key: "reference",
      header: "Reference",
      hideOnMobile: true,
      cell: (p) => p.referenceNumber ?? "—",
    },
  ];

  const outstanding = balance ? Number(balance.outstanding) : null;
  const canPay =
    canManage &&
    isPosted &&
    outstanding !== null &&
    outstanding > 0 &&
    !paymentMutation.isPending;

  const needsCommitmentFx = currency !== FINANCIAL_REPORTING_CURRENCY;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={invoice?.invoiceNumber ?? "Invoice"}
        description="Invoice details, posting, and payment history."
        breadcrumbs={[{ label: "Invoices", href: "/invoices" }, { label: invoice?.invoiceNumber ?? id }]}
        actions={
          <Button variant="outline" size="md" asChild>
            <Link href="/invoices">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      {invoiceQuery.isError ? (
        <Card className="p-4 text-sm text-destructive">
          {invoiceQuery.error instanceof ApiClientError
            ? invoiceQuery.error.message
            : "Failed to load invoice."}
        </Card>
      ) : null}

      {invoice ? (
        <>
          <RecordOverviewCard>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold truncate">{invoice.invoiceNumber}</h2>
                <p className="text-sm text-muted-foreground">
                  {invoice.purchaseOrder?.vendor?.vendorName ?? "Invoice"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill
                  status={invoicePaymentToPill(invoice.paymentStatus)}
                  label={INVOICE_PAYMENT_LABELS[invoice.paymentStatus] ?? invoice.paymentStatus}
                  dot
                />
                {!isPosted ? (
                  <StatusPill status="pending" label="Not posted" dot />
                ) : null}
                <span className="text-sm font-semibold tabular">
                  {formatCurrency(Number(invoice.invoiceAmount), currency)}
                </span>
              </div>
            </div>
          </RecordOverviewCard>

          <DetailRecordLayout
            aside={
              <SectionCard title="Balance">
                {balanceQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading balance…</p>
                ) : balance ? (
                  <dl className="flex flex-col gap-3">
                    <DetailField label="Invoice total" value={formatCurrency(Number(balance.invoiceAmount), currency)} />
                    <DetailField
                      label="Paid total"
                      value={formatCurrency(Number(balance.paidTotal), currency)}
                    />
                    <DetailField
                      label="Outstanding"
                      value={formatCurrency(Number(balance.outstanding), currency)}
                    />
                    <DetailField
                      label={`Paid (${balance.reportingCurrency})`}
                      value={formatCurrency(Number(balance.paidTotalUsd), balance.reportingCurrency)}
                    />
                    <DetailField
                      label="Posted at"
                      value={balance.postedAt ? balance.postedAt.slice(0, 10) : "Not posted"}
                    />
                    {balance.commitmentAmountUsd ? (
                      <DetailField
                        label={`Committed (${balance.reportingCurrency})`}
                        value={formatCurrency(Number(balance.commitmentAmountUsd), balance.reportingCurrency)}
                      />
                    ) : null}
                    <DetailField label="Invoice date" value={invoice.invoiceDate?.slice(0, 10)} />
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">Balance unavailable.</p>
                )}
                {invoice.purchaseOrderId ? (
                  <p className="mt-4 text-sm">
                    <Link
                      href={`/purchase-orders/${invoice.purchaseOrderId}`}
                      className="text-primary hover:underline"
                    >
                      View purchase order
                    </Link>
                  </p>
                ) : null}
              </SectionCard>
            }
          >
            {canManage && !isPosted ? (
              <SectionCard title="Post invoice (commit budget)">
                <p className="mb-4 text-sm text-muted-foreground">
                  Committed expenditure is recorded when the invoice is posted. Payments are recorded separately and
                  only the amount paid counts as actual expenditure ({FINANCIAL_REPORTING_CURRENCY} reporting uses
                  manual rates on payment dates).
                </p>
                <form
                  className="grid w-full gap-4 md:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const parsed = postInvoiceSchema.safeParse({
                      budgetId: postBudgetId,
                      commitmentExchangeRateToUsd:
                        commitmentRate.trim() === "" ? undefined : Number(commitmentRate),
                    });
                    if (!parsed.success) {
                      toast.error(parsed.error.errors[0]?.message ?? "Invalid post form");
                      return;
                    }
                    postMutation.mutate(parsed.data);
                  }}
                >
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="postBudgetId">Budget allocation</Label>
                    <FilterSelect
                      aria-label="Budget allocation"
                      value={postBudgetId}
                      onChange={setPostBudgetId}
                      placeholder="Select budget"
                      options={(allocationsQuery.data ?? []).map((b) => ({
                        value: b.budgetId,
                        label: `${b.budgetCategory} · ${formatCurrency(Number(b.allocatedAmount), b.currency)}`,
                      }))}
                      className="w-full max-w-md"
                    />
                  </div>
                  {needsCommitmentFx ? (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="commitmentRate">
                        Manual {currency} → {FINANCIAL_REPORTING_CURRENCY} rate at post (optional)
                      </Label>
                      <Input
                        id="commitmentRate"
                        type="number"
                        step="0.000001"
                        min="0"
                        value={commitmentRate}
                        onChange={(ev) => setCommitmentRate(ev.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        If omitted, committed {FINANCIAL_REPORTING_CURRENCY} stays provisional until client confirms
                        valuation at post.
                      </p>
                    </div>
                  ) : null}
                  <Button type="submit" size="md" disabled={!postBudgetId || postMutation.isPending}>
                    {postMutation.isPending ? "Posting…" : "Post invoice"}
                  </Button>
                </form>
              </SectionCard>
            ) : null}

            <SectionCard title="Invoice details">
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailField label="PO number" value={invoice.purchaseOrder?.poNumber ?? "—"} />
                <DetailField
                  label="Vendor"
                  value={invoice.purchaseOrder?.vendor?.vendorName ?? "—"}
                />
                <DetailField label="Currency" value={currency} />
              </dl>
            </SectionCard>

            <SectionCard title="Payment history" flush>
              <DataTable
                data={payments}
                columns={paymentColumns}
                getRowId={(p) => p.invoicePaymentId}
                loading={paymentsQuery.isLoading}
                empty={<p className="p-4 text-sm text-muted-foreground">No payments recorded yet.</p>}
              />
            </SectionCard>

            {canManage ? (
              <SectionCard title="Record payment">
                {!isPosted ? (
                  <p className="text-sm text-muted-foreground">Post this invoice to a budget before recording payments.</p>
                ) : outstanding !== null && outstanding <= 0 ? (
                  <p className="text-sm text-muted-foreground">This invoice is fully paid.</p>
                ) : (
                  <form
                    className="grid w-full gap-4 md:grid-cols-2"
                    onSubmit={handleSubmit((values) => {
                      if (!canPay) return;
                      paymentMutation.mutate(values);
                    })}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount ({currency})</Label>
                      <Input id="amount" type="number" step="0.01" min="0" {...register("amount")} />
                      {errors.amount ? (
                        <p className="text-xs text-destructive">{errors.amount.message}</p>
                      ) : null}
                    </div>
                    {currency !== FINANCIAL_REPORTING_CURRENCY ? (
                      <div className="space-y-2">
                        <Label htmlFor="exchangeRateToUsd">
                          Manual {currency} → {FINANCIAL_REPORTING_CURRENCY} rate (payment date)
                        </Label>
                        <Input
                          id="exchangeRateToUsd"
                          type="number"
                          step="0.000001"
                          min="0"
                          {...register("exchangeRateToUsd", { valueAsNumber: true })}
                        />
                        {errors.exchangeRateToUsd ? (
                          <p className="text-xs text-destructive">{errors.exchangeRateToUsd.message}</p>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <Label htmlFor="paidAt">Paid at (optional)</Label>
                      <Input id="paidAt" type="datetime-local" {...register("paidAt")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referenceNumber">Reference</Label>
                      <Input id="referenceNumber" {...register("referenceNumber")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Input id="notes" {...register("notes")} />
                    </div>
                    <Button type="submit" size="md" disabled={!canPay} className="md:col-span-2 w-fit">
                      {paymentMutation.isPending ? "Recording…" : "Record payment"}
                    </Button>
                    <p className="text-xs text-muted-foreground md:col-span-2">
                      Only amounts paid on the invoice are recognized as actual expenditure. Overpayments are rejected.
                    </p>
                  </form>
                )}
              </SectionCard>
            ) : null}
          </DetailRecordLayout>
        </>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Receipt } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterSelect } from "@/components/common/FilterSelect";
import {
  CreateFormActions,
  CreateFormLayout,
} from "@/components/crud/CreateFormLayout";
import {
  CreateFormPreviewCard,
  CreateFormTips,
  CreateFormValidationCard,
} from "@/components/crud/CreateFormAside";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { createInvoice, type Invoice } from "@/lib/api/invoices";
import { fetchPurchaseOrders } from "@/lib/api/purchase-orders";
import { createInvoiceSchema, type CreateInvoiceInput } from "@/lib/validators/invoice";
import { ApiClientError } from "@/lib/api/client";

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const poSearch = searchParams.get("po")?.trim() ?? "";
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKeys.invoicesManage);

  const { data: poPage, isLoading: posLoading } = useQuery({
    queryKey: ["purchase-orders", "select", "invoice-new", poSearch],
    queryFn: () =>
      fetchPurchaseOrders({
        page: 1,
        pageSize: 100,
        search: poSearch || undefined,
      }),
  });

  const poOptions = (poPage?.data ?? []).map((po) => ({
    value: po.purchaseOrderId,
    label: `${po.poNumber} · ${po.vendor?.vendorName ?? po.vendorId}`,
  }));

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      invoiceNumber: "",
      purchaseOrderId: "",
      invoiceDate: "",
      invoiceAmount: "" as unknown as CreateInvoiceInput["invoiceAmount"],
    },
  });

  const preview = watch();
  const poLabel =
    poOptions.find((p) => p.value === preview.purchaseOrderId)?.label ?? "Purchase order";

  const mutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: (invoice: Invoice) => {
      toast.success("Invoice created");
      router.push(`/invoices/${invoice.invoiceId}`);
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to create invoice");
    },
  });

  if (!canManage) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader variant="standard" title="New invoice" description="Register an invoice against a PO." />
        <Card className="p-6 text-sm text-muted-foreground">
          You need invoices.manage permission.{" "}
          <Link href="/invoices" className="text-primary hover:underline">
            Back to list
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader variant="standard"
        title="New invoice"
        description="Link to a purchase order; payment status starts as unpaid."
        breadcrumbs={[{ label: "Invoices", href: "/invoices" }, { label: "New" }]}
        actions={
          <Button variant="outline" size="md" asChild>
            <Link href="/invoices">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <CreateFormLayout
        aside={
          <>
            <CreateFormValidationCard
              requiredFields={["Invoice number", "Purchase order", "Invoice date", "Amount"]}
            />
            <CreateFormTips
              tips={[
                "Invoices must reference an existing purchase order.",
                "Record payments from the invoice detail page after creation.",
              ]}
            />
            <CreateFormPreviewCard title="Invoice preview">
              <p className="font-medium truncate">{preview.invoiceNumber || "Invoice number"}</p>
              <p className="text-xs text-muted-foreground truncate">{poLabel}</p>
              <p className="text-xs text-muted-foreground">
                {preview.invoiceDate || "Date"}
                {preview.invoiceAmount ? ` · ${preview.invoiceAmount}` : ""}
              </p>
            </CreateFormPreviewCard>
          </>
        }
      >
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="flex flex-col gap-6"
          noValidate
        >
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-4 w-4 text-primary" />
                Invoice details
              </CardTitle>
              <span className="text-xs font-medium text-destructive">* Required</span>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="invoiceNumber" required>
                  Invoice number
                </Label>
                <Input id="invoiceNumber" error={!!errors.invoiceNumber} {...register("invoiceNumber")} />
                {errors.invoiceNumber ? (
                  <p className="text-xs text-destructive">{errors.invoiceNumber.message}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label required>Purchase order</Label>
                <Controller
                  control={control}
                  name="purchaseOrderId"
                  render={({ field }) => (
                    <FilterSelect
                      aria-label="Purchase order"
                      value={field.value}
                      onChange={field.onChange}
                      options={poOptions}
                      placeholder={posLoading ? "Loading POs…" : "Select PO"}
                    />
                  )}
                />
                {errors.purchaseOrderId ? (
                  <p className="text-xs text-destructive">{errors.purchaseOrderId.message}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="invoiceDate" required>
                  Invoice date
                </Label>
                <Input id="invoiceDate" type="date" error={!!errors.invoiceDate} {...register("invoiceDate")} />
                {errors.invoiceDate ? (
                  <p className="text-xs text-destructive">{errors.invoiceDate.message}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="invoiceAmount" required>
                  Amount
                </Label>
                <Input
                  id="invoiceAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  error={!!errors.invoiceAmount}
                  {...register("invoiceAmount")}
                />
                {errors.invoiceAmount ? (
                  <p className="text-xs text-destructive">{errors.invoiceAmount.message}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <CreateFormActions>
            <Button type="button" variant="outline" size="md" asChild>
              <Link href="/invoices">Cancel</Link>
            </Button>
            <Button type="submit" size="md" loading={mutation.isPending}>
              Create invoice
            </Button>
          </CreateFormActions>
        </form>
      </CreateFormLayout>
    </div>
  );
}

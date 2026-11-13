"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ShoppingCart } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FORM_HINTS } from "@/lib/form-field-hints";
import { FormField } from "@/components/forms/FormField";
import { fieldErrorMessage, fieldHasError } from "@/lib/forms/field-error";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";
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
import { createPurchaseOrderDraft, type PurchaseOrder } from "@/lib/api/purchase-orders";
import { fetchVendors } from "@/lib/api/vendors";
import { fetchContracts } from "@/lib/api/contracts";
import {
  createPurchaseOrderSchema,
  type CreatePurchaseOrderInput,
} from "@/lib/validators/purchase-order";
import { ApiClientError } from "@/lib/api/client";

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorSearch = searchParams.get("vendor")?.trim() ?? "";
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKeys.purchaseOrdersManage);

  const { data: vendorPage, isLoading: vendorsLoading } = useQuery({
    queryKey: ["vendors", "select", "po-new", vendorSearch],
    queryFn: () =>
      fetchVendors({
        page: 1,
        pageSize: 100,
        isActive: true,
        search: vendorSearch || undefined,
      }),
  });

  const vendorOptions = (vendorPage?.data ?? []).map((v) => ({
    value: v.vendorId,
    label: v.vendorName,
  }));

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isDirty, touchedFields, isSubmitted },
  } = useForm<CreatePurchaseOrderInput>({
    resolver: zodResolver(createPurchaseOrderSchema),
    mode: "onTouched",
    defaultValues: {
      poNumber: "",
      vendorId: "",
      contractId: "",
      poDate: "",
      currency: "USD",
      validUntil: "",
    },
  });

  useUnsavedChangesWarning(isDirty);

  const preview = watch();
  const vendorId = preview.vendorId;
  const vendorName =
    vendorOptions.find((v) => v.value === preview.vendorId)?.label ?? "Vendor";

  const { data: contractPage } = useQuery({
    queryKey: ["contracts", "vendor", vendorId],
    queryFn: () => fetchContracts({ page: 1, pageSize: 100, vendorId }),
    enabled: !!vendorId,
  });

  const contractOptions = (contractPage?.data ?? []).map((c) => ({
    value: c.contractId,
    label: c.contractNumber,
  }));

  const mutation = useMutation({
    mutationFn: createPurchaseOrderDraft,
    onSuccess: (po: PurchaseOrder) => {
      toast.success("Purchase order created (approved)");
      router.push(`/purchase-orders/${po.purchaseOrderId}`);
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to create purchase order");
    },
  });

  if (!canManage) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader variant="standard" title="New purchase order" description="Create a draft PO." />
        <Card className="p-6 text-sm text-muted-foreground">
          You need the purchaseOrders.manage permission to create drafts.{" "}
          <Link href="/purchase-orders" className="text-primary hover:underline">
            Back to list
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader variant="standard"
        title="New purchase order"
        description="Create a draft purchase order."
        breadcrumbs={[{ label: "Purchase orders", href: "/purchase-orders" }, { label: "New" }]}
        actions={
          <Button variant="outline" size="md" asChild>
            <Link href="/purchase-orders">
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
              requiredFields={["PO number", "Vendor", "PO date", "Currency"]}
            />
            <CreateFormTips
              tips={[
                "Draft POs can receive line items on the detail page.",
                "Workflow actions remain policy-gated after creation.",
              ]}
            />
            <CreateFormPreviewCard title="Draft preview">
              <p className="font-medium truncate">{preview.poNumber || "PO number"}</p>
              <p className="text-xs text-muted-foreground truncate">{vendorName}</p>
              <p className="text-xs text-muted-foreground">
                {preview.poDate || "PO date"} · {preview.currency || "USD"}
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
                <ShoppingCart className="h-4 w-4 text-primary" />
                Purchase order header
              </CardTitle>
              <span className="text-xs font-medium text-destructive">* Required</span>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                className="md:col-span-2"
                label="PO number"
                htmlFor="poNumber"
                required
                description={FORM_HINTS.poNumber}
                error={fieldErrorMessage("poNumber", touchedFields, isSubmitted, errors)}
              >
                <Input
                  id="poNumber"
                  error={fieldHasError("poNumber", touchedFields, isSubmitted, errors)}
                  {...register("poNumber")}
                />
              </FormField>

              <FormField
                className="md:col-span-2"
                label="Vendor"
                htmlFor="vendorId"
                required
                description="Approved supplier this PO is issued against."
                error={fieldErrorMessage("vendorId", touchedFields, isSubmitted, errors)}
              >
                <Controller
                  control={control}
                  name="vendorId"
                  render={({ field }) => (
                    <SearchableSelect
                      aria-label="Vendor"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={vendorsLoading ? "Loading…" : "Search or select vendor"}
                      searchPlaceholder="Search vendors…"
                      options={vendorOptions}
                    />
                  )}
                />
              </FormField>

              <FormField
                className="md:col-span-2"
                label="Contract"
                htmlFor="contractId"
                description="Link an active vendor contract when the PO is covered by one."
              >
                <Controller
                  control={control}
                  name="contractId"
                  render={({ field }) => (
                    <SearchableSelect
                      aria-label="Contract"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      disabled={!vendorId}
                      placeholder={vendorId ? "Search or select contract (optional)" : "Select vendor first"}
                      searchPlaceholder="Search contracts…"
                      options={[{ value: "", label: "No contract" }, ...contractOptions]}
                    />
                  )}
                />
              </FormField>

              <FormField
                label="PO date"
                htmlFor="poDate"
                required
                description="Document date printed on the purchase order."
                error={fieldErrorMessage("poDate", touchedFields, isSubmitted, errors)}
              >
                <Input
                  id="poDate"
                  type="date"
                  error={fieldHasError("poDate", touchedFields, isSubmitted, errors)}
                  {...register("poDate")}
                />
              </FormField>
              <FormField
                label="Currency"
                htmlFor="currency"
                required
                description="Three-letter ISO code for PO amounts (default USD)."
                error={fieldErrorMessage("currency", touchedFields, isSubmitted, errors)}
              >
                <Input
                  id="currency"
                  maxLength={3}
                  className="uppercase"
                  error={fieldHasError("currency", touchedFields, isSubmitted, errors)}
                  {...register("currency")}
                />
              </FormField>
              <FormField
                className="md:col-span-2"
                label="Valid until"
                htmlFor="validUntil"
                description="Last date vendors may fulfill this PO (optional)."
              >
                <Input id="validUntil" type="date" {...register("validUntil")} />
              </FormField>
            </CardContent>
          </Card>

          <CreateFormActions>
            <Button type="button" variant="outline" size="md" asChild>
              <Link href="/purchase-orders">Cancel</Link>
            </Button>
            <Button type="submit" size="md" loading={mutation.isPending}>
              Create draft
            </Button>
          </CreateFormActions>
        </form>
      </CreateFormLayout>
    </div>
  );
}

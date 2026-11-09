"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, KeyRound } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import { fieldErrorMessage, fieldHasError } from "@/lib/forms/field-error";
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
import { createSoftwareLicense, type SoftwareLicense } from "@/lib/api/software-licenses";
import { fetchVendors } from "@/lib/api/vendors";
import { fetchPurchaseOrders } from "@/lib/api/purchase-orders";
import { createLicenseSchema, type CreateLicenseInput } from "@/lib/validators/software-license";
import { ApiClientError } from "@/lib/api/client";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";

const NONE = "";

export default function NewSoftwareLicensePage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKeys.licensesManage);

  const { data: vendorPage } = useQuery({
    queryKey: ["vendors", "select", "license-new"],
    queryFn: () => fetchVendors({ page: 1, pageSize: 200, isActive: true }),
    enabled: canManage,
  });

  const { data: poPage } = useQuery({
    queryKey: ["purchase-orders", "select", "license-new"],
    queryFn: () => fetchPurchaseOrders({ page: 1, pageSize: 200 }),
    enabled: canManage,
  });

  const vendorOptions = [
    { value: NONE, label: "None" },
    ...(vendorPage?.data ?? []).map((v) => ({ value: v.vendorId, label: v.vendorName })),
  ];

  const poOptions = [
    { value: NONE, label: "None" },
    ...(poPage?.data ?? []).map((po) => ({
      value: po.purchaseOrderId,
      label: po.poNumber,
      hint: po.vendor?.vendorName,
    })),
  ];

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isDirty, touchedFields, isSubmitted },
  } = useForm<CreateLicenseInput>({
    resolver: zodResolver(createLicenseSchema),
    mode: "onTouched",
    defaultValues: {
      softwareName: "",
      licenseKeyReference: "",
      vendorId: "",
      purchaseOrderId: "",
      startDate: "",
      expiryDate: "",
      licenseQuantity: 1,
      status: "ACTIVE",
    },
  });

  useUnsavedChangesWarning(isDirty);

  const preview = watch();

  const mutation = useMutation({
    mutationFn: createSoftwareLicense,
    onSuccess: (license: SoftwareLicense) => {
      toast.success("License created");
      router.push(`/software-licenses/${license.licenseId}`);
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Failed to create license"),
  });

  if (!canManage) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        licenses.manage required.{" "}
        <Link href="/software-licenses" className="text-primary hover:underline">
          Back
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader variant="standard"
        title="New software license"
        breadcrumbs={[{ label: "Licenses", href: "/software-licenses" }, { label: "New" }]}
        actions={
          <Button variant="outline" size="md" asChild>
            <Link href="/software-licenses">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <CreateFormLayout
        aside={
          <>
            <CreateFormValidationCard requiredFields={["Software name", "Start date", "Expiry date"]} />
            <CreateFormTips
              tips={[
                "Key references are stored per license policy — not shown on list pages.",
                "Link vendor or PO when procurement records exist.",
              ]}
            />
            <CreateFormPreviewCard title="License preview">
              <p className="font-medium truncate">{preview.softwareName || "Software name"}</p>
              <p className="text-xs text-muted-foreground">
                Qty {preview.licenseQuantity ?? 1}
              </p>
              <p className="text-xs text-muted-foreground">
                {[preview.startDate, preview.expiryDate].filter(Boolean).join(" → ") || "Term"}
              </p>
            </CreateFormPreviewCard>
          </>
        }
      >
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="flex flex-col gap-6"
          noValidate
        >
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-4 w-4 text-primary" />
                License information
              </CardTitle>
              <span className="text-xs font-medium text-destructive">* Required</span>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <FormField
                  label="Software name"
                  htmlFor="softwareName"
                  required
                  description="Product name as shown on the license certificate."
                  error={fieldErrorMessage("softwareName", touchedFields, isSubmitted, errors)}
                >
                  <Input
                    id="softwareName"
                    error={fieldHasError("softwareName", touchedFields, isSubmitted, errors)}
                    {...register("softwareName")}
                  />
                </FormField>
              </div>
              <FormField
                className="md:col-span-2"
                label="Key reference"
                htmlFor="licenseKeyReference"
                description="Store a reference or vault key ID — never paste raw license keys."
              >
                <Input id="licenseKeyReference" {...register("licenseKeyReference")} />
              </FormField>
              <FormField
                label="Vendor"
                description="Supplier tied to procurement records (optional)."
              >
                <Controller
                  control={control}
                  name="vendorId"
                  render={({ field }) => (
                    <SearchableSelect
                      aria-label="Vendor"
                      value={field.value ?? NONE}
                      onChange={(v) => field.onChange(v === NONE ? "" : v)}
                      options={vendorOptions}
                      placeholder="Search vendors…"
                    />
                  )}
                />
              </FormField>
              <FormField
                label="Purchase order"
                description="PO that funded this license (optional)."
              >
                <Controller
                  control={control}
                  name="purchaseOrderId"
                  render={({ field }) => (
                    <SearchableSelect
                      aria-label="Purchase order"
                      value={field.value ?? NONE}
                      onChange={(v) => field.onChange(v === NONE ? "" : v)}
                      options={poOptions}
                      placeholder="Search POs…"
                    />
                  )}
                />
              </FormField>
              <FormField
                label="Start date"
                htmlFor="startDate"
                required
                description="Coverage start date on the certificate."
                error={fieldErrorMessage("startDate", touchedFields, isSubmitted, errors)}
              >
                <Input
                  id="startDate"
                  type="date"
                  error={fieldHasError("startDate", touchedFields, isSubmitted, errors)}
                  {...register("startDate")}
                />
              </FormField>
              <div className="flex flex-col gap-1.5">
                <FormField
                  label="License expiry date"
                  htmlFor="expiryDate"
                  required
                  description="Select the date this license expires."
                  error={fieldErrorMessage("expiryDate", touchedFields, isSubmitted, errors)}
                >
                  <Input
                    id="expiryDate"
                    type="date"
                    error={fieldHasError("expiryDate", touchedFields, isSubmitted, errors)}
                    {...register("expiryDate")}
                  />
                </FormField>
              </div>
              <FormField
                label="License quantity"
                htmlFor="licenseQuantity"
                description="Seat or instance count purchased."
                error={fieldErrorMessage("licenseQuantity", touchedFields, isSubmitted, errors)}
              >
                <Input
                  id="licenseQuantity"
                  type="number"
                  min={1}
                  error={fieldHasError("licenseQuantity", touchedFields, isSubmitted, errors)}
                  {...register("licenseQuantity", { valueAsNumber: true })}
                />
              </FormField>
              <FormField
                label="Renewal cost"
                htmlFor="renewalCost"
                description="Expected annual renewal (optional)."
                error={fieldErrorMessage("renewalCost", touchedFields, isSubmitted, errors)}
              >
                <Input
                  id="renewalCost"
                  type="number"
                  step="0.01"
                  error={fieldHasError("renewalCost", touchedFields, isSubmitted, errors)}
                  {...register("renewalCost", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
                />
              </FormField>
            </CardContent>
          </Card>

          <CreateFormActions>
            <Button type="button" variant="outline" size="md" asChild>
              <Link href="/software-licenses">Cancel</Link>
            </Button>
            <Button type="submit" size="md" loading={mutation.isPending}>
              Create license
            </Button>
          </CreateFormActions>
        </form>
      </CreateFormLayout>
    </div>
  );
}

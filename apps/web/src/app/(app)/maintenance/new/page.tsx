"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Wrench } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import {
  CreateFormActions,
  CreateFormLayout,
} from "@/components/crud/CreateFormLayout";
import {
  CreateFormTips,
  CreateFormValidationCard,
} from "@/components/crud/CreateFormAside";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { createMaintenanceRecord, type MaintenanceRecord } from "@/lib/api/maintenance";
import { fetchAssets } from "@/lib/api/assets";
import { fetchContracts } from "@/lib/api/contracts";
import { fetchVendors } from "@/lib/api/vendors";
import { createMaintenanceSchema, type CreateMaintenanceInput } from "@/lib/validators/maintenance";
import { ApiClientError } from "@/lib/api/client";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";

const NONE = "";

export default function NewMaintenancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKeys.maintenanceManage);

  const { data: assetPage } = useQuery({
    queryKey: ["assets", "select", "maintenance-new"],
    queryFn: () => fetchAssets({ page: 1, pageSize: 200 }),
    enabled: canManage,
  });

  const { data: contractPage } = useQuery({
    queryKey: ["contracts", "select", "maintenance-new"],
    queryFn: () => fetchContracts({ page: 1, pageSize: 200 }),
    enabled: canManage,
  });

  const { data: vendorPage } = useQuery({
    queryKey: ["vendors", "select", "maintenance-new"],
    queryFn: () => fetchVendors({ page: 1, pageSize: 200, isActive: true }),
    enabled: canManage,
  });

  const assetOptions = [
    { value: NONE, label: "None" },
    ...(assetPage?.data ?? []).map((a) => ({
      value: a.assetId,
      label: a.assetCode,
      hint: a.assetName,
    })),
  ];

  const contractOptions = [
    { value: NONE, label: "None" },
    ...(contractPage?.data ?? []).map((c) => ({
      value: c.contractId,
      label: c.contractNumber,
    })),
  ];

  const vendorOptions = [
    { value: NONE, label: "None" },
    ...(vendorPage?.data ?? []).map((v) => ({
      value: v.vendorId,
      label: v.vendorName,
    })),
  ];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<CreateMaintenanceInput>({
    resolver: zodResolver(createMaintenanceSchema),
    defaultValues: {
      assetId: searchParams.get("assetId") ?? "",
      contractId: "",
      vendorId: "",
      maintenanceType: "",
      requestDate: "",
      remarks: "",
    },
  });

  useUnsavedChangesWarning(isDirty);

  const mutation = useMutation({
    mutationFn: createMaintenanceRecord,
    onSuccess: (record: MaintenanceRecord) => {
      toast.success("Maintenance request created");
      router.push(`/maintenance/${record.maintenanceId}`);
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Failed to create record"),
  });

  if (!canManage) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader variant="standard" title="New maintenance" />
        <Card className="p-6 text-sm text-muted-foreground">
          maintenance.manage required.{" "}
          <Link href="/maintenance" className="text-primary hover:underline">
            Back
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        variant="standard"
        title="New maintenance request"
        description="Link an asset, contract, or vendor; progress status on the detail page."
        breadcrumbs={[{ label: "Maintenance", href: "/maintenance" }, { label: "New" }]}
        actions={
          <Button variant="outline" size="md" asChild>
            <Link href="/maintenance">
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
              requiredFields={["Maintenance type", "Request date", "At least one of asset / contract / vendor"]}
            />
            <CreateFormTips
              tips={[
                "Provide at least one linked asset, contract, or vendor.",
                "Status progresses on the detail page after creation.",
              ]}
            />
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
                <Wrench className="h-4 w-4 text-primary" />
                Request details
              </CardTitle>
              <span className="text-xs font-medium text-destructive">* Required</span>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Asset" error={errors.assetId?.message} className="md:col-span-2" hint="Optional link">
                <Controller
                  control={control}
                  name="assetId"
                  render={({ field }) => (
                    <SearchableSelect
                      aria-label="Asset"
                      value={field.value ?? NONE}
                      onChange={(v) => field.onChange(v === NONE ? "" : v)}
                      options={assetOptions}
                      placeholder="Search assets…"
                      searchPlaceholder="Asset code or name"
                    />
                  )}
                />
              </FormField>

              <FormField label="Contract" error={errors.contractId?.message} hint="Optional link">
                <Controller
                  control={control}
                  name="contractId"
                  render={({ field }) => (
                    <SearchableSelect
                      aria-label="Contract"
                      value={field.value ?? NONE}
                      onChange={(v) => field.onChange(v === NONE ? "" : v)}
                      options={contractOptions}
                      placeholder="Search contracts…"
                      searchPlaceholder="Contract number"
                    />
                  )}
                />
              </FormField>

              <FormField label="Vendor" error={errors.vendorId?.message} hint="Optional link">
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
                      searchPlaceholder="Vendor name"
                    />
                  )}
                />
              </FormField>

              <FormField
                label="Type"
                htmlFor="maintenanceType"
                required
                error={errors.maintenanceType?.message}
              >
                <Input id="maintenanceType" error={!!errors.maintenanceType} {...register("maintenanceType")} />
              </FormField>

              <FormField
                label="Request date"
                htmlFor="requestDate"
                required
                error={errors.requestDate?.message}
              >
                <Input id="requestDate" type="date" error={!!errors.requestDate} {...register("requestDate")} />
              </FormField>

              <FormField label="Cost (optional)" htmlFor="cost" className="md:col-span-2">
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("cost", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
                />
              </FormField>

              <FormField label="Remarks" htmlFor="remarks" className="md:col-span-2">
                <Input id="remarks" {...register("remarks")} />
              </FormField>
            </CardContent>
          </Card>

          <CreateFormActions>
            <Button type="button" variant="outline" size="md" asChild>
              <Link href="/maintenance">Cancel</Link>
            </Button>
            <Button type="submit" size="md" loading={mutation.isPending}>
              Create request
            </Button>
          </CreateFormActions>
        </form>
      </CreateFormLayout>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, FileText } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createContract, type Contract } from "@/lib/api/contracts";
import { fetchVendors } from "@/lib/api/vendors";
import { createContractSchema, type CreateContractInput } from "@/lib/validators/contract";
import { ApiClientError } from "@/lib/api/client";

export default function NewContractPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorSearch = searchParams.get("vendor")?.trim() ?? "";
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKeys.contractsManage);

  const { data: vendorPage, isLoading: vendorsLoading } = useQuery({
    queryKey: ["vendors", "select", "contracts-new", vendorSearch],
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
  } = useForm<CreateContractInput>({
    resolver: zodResolver(createContractSchema),
    mode: "onTouched",
    defaultValues: {
      contractNumber: "",
      vendorId: "",
      startDate: "",
      expiryDate: "",
      contractValue: undefined,
      renewalStatus: "",
    },
  });

  useUnsavedChangesWarning(isDirty);

  const preview = watch();
  const vendorName =
    vendorOptions.find((v) => v.value === preview.vendorId)?.label ?? "Vendor";

  const mutation = useMutation({
    mutationFn: createContract,
    onSuccess: (contract: Contract) => {
      toast.success("Contract created");
      router.push(`/contracts/${contract.contractId}`);
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to create contract");
    },
  });

  if (!canManage) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader variant="standard" title="Add contract" description="Create a new vendor contract." />
        <Card className="p-6 text-sm text-muted-foreground">
          You need the contracts.manage permission to add contracts.{" "}
          <Link href="/contracts" className="text-primary hover:underline">
            Back to list
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader variant="standard"
        title="Add contract"
        description="Register a vendor or service contract."
        breadcrumbs={[{ label: "Contracts", href: "/contracts" }, { label: "New" }]}
        actions={
          <Button variant="outline" size="md" asChild>
            <Link href="/contracts">
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
              requiredFields={["Contract number", "Vendor", "Start date", "Expiry date"]}
            />
            <CreateFormTips
              tips={[
                "Contract numbers must be unique.",
                "Expiry dates drive renewal alerts on the dashboard.",
              ]}
            />
            <CreateFormPreviewCard title="Contract preview">
              <p className="font-medium truncate">{preview.contractNumber || "Contract number"}</p>
              <p className="text-xs text-muted-foreground truncate">{vendorName}</p>
              <p className="text-xs text-muted-foreground">
                {[preview.startDate, preview.expiryDate].filter(Boolean).join(" → ") || "Date range"}
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
                <FileText className="h-4 w-4 text-primary" />
                Contract details
              </CardTitle>
              <span className="text-xs font-medium text-destructive">* Required</span>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                className="md:col-span-2"
                label="Contract number"
                htmlFor="contractNumber"
                required
                description="Official contract or agreement reference."
                error={fieldErrorMessage("contractNumber", touchedFields, isSubmitted, errors)}
              >
                <Input
                  id="contractNumber"
                  error={fieldHasError("contractNumber", touchedFields, isSubmitted, errors)}
                  {...register("contractNumber")}
                />
              </FormField>

              <FormField
                className="md:col-span-2"
                label="Vendor"
                htmlFor="vendorId"
                required
                description="Supplier or service provider party to this agreement."
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
                label="Start date"
                htmlFor="startDate"
                required
                description="First day the contract obligations are effective."
                error={fieldErrorMessage("startDate", touchedFields, isSubmitted, errors)}
              >
                <Input
                  id="startDate"
                  type="date"
                  error={fieldHasError("startDate", touchedFields, isSubmitted, errors)}
                  {...register("startDate")}
                />
              </FormField>
              <FormField
                label="Expiry date"
                htmlFor="expiryDate"
                required
                description="Last day of coverage — drives renewal notifications."
                error={fieldErrorMessage("expiryDate", touchedFields, isSubmitted, errors)}
              >
                <Input
                  id="expiryDate"
                  type="date"
                  error={fieldHasError("expiryDate", touchedFields, isSubmitted, errors)}
                  {...register("expiryDate")}
                />
              </FormField>
              <FormField
                label="Contract value"
                htmlFor="contractValue"
                description="Total contract amount for budgeting (optional)."
                error={fieldErrorMessage("contractValue", touchedFields, isSubmitted, errors)}
              >
                <Input
                  id="contractValue"
                  type="number"
                  min={0}
                  step="0.01"
                  error={fieldHasError("contractValue", touchedFields, isSubmitted, errors)}
                  {...register("contractValue")}
                />
              </FormField>
              <FormField
                label="Renewal status"
                htmlFor="renewalStatus"
                description="Pipeline label such as Pending, Renewed, or Cancelled (optional)."
              >
                <Input id="renewalStatus" {...register("renewalStatus")} />
              </FormField>
            </CardContent>
          </Card>

          <CreateFormActions>
            <Button type="button" variant="outline" size="md" asChild>
              <Link href="/contracts">Cancel</Link>
            </Button>
            <Button type="submit" size="md" loading={mutation.isPending}>
              Create contract
            </Button>
          </CreateFormActions>
        </form>
      </CreateFormLayout>
    </div>
  );
}

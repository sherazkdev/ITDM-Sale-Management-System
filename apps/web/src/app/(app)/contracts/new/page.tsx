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
    formState: { errors },
  } = useForm<CreateContractInput>({
    resolver: zodResolver(createContractSchema),
    defaultValues: {
      contractNumber: "",
      vendorId: "",
      startDate: "",
      expiryDate: "",
      contractValue: undefined,
      renewalStatus: "",
    },
  });

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
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="contractNumber" required>
                  Contract number
                </Label>
                <Input
                  id="contractNumber"
                  error={!!errors.contractNumber}
                  {...register("contractNumber")}
                />
                {errors.contractNumber ? (
                  <p className="text-xs text-destructive">{errors.contractNumber.message}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="vendorId" required>
                  Vendor
                </Label>
                <Controller
                  control={control}
                  name="vendorId"
                  render={({ field }) => (
                    <FilterSelect
                      aria-label="Vendor"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={vendorsLoading ? "Loading…" : "Select vendor"}
                      options={vendorOptions}
                    />
                  )}
                />
                {errors.vendorId ? (
                  <p className="text-xs text-destructive">{errors.vendorId.message}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="startDate" required>
                  Start date
                </Label>
                <Input id="startDate" type="date" error={!!errors.startDate} {...register("startDate")} />
                {errors.startDate ? (
                  <p className="text-xs text-destructive">{errors.startDate.message}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="expiryDate" required>
                  Expiry date
                </Label>
                <Input id="expiryDate" type="date" error={!!errors.expiryDate} {...register("expiryDate")} />
                {errors.expiryDate ? (
                  <p className="text-xs text-destructive">{errors.expiryDate.message}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contractValue">Contract value</Label>
                <Input
                  id="contractValue"
                  type="number"
                  min={0}
                  step="0.01"
                  {...register("contractValue")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="renewalStatus">Renewal status</Label>
                <Input id="renewalStatus" {...register("renewalStatus")} />
              </div>
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

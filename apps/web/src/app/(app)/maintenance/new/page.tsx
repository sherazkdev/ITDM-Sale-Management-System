"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Wrench } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createMaintenanceSchema, type CreateMaintenanceInput } from "@/lib/validators/maintenance";
import { ApiClientError } from "@/lib/api/client";

export default function NewMaintenancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKeys.maintenanceManage);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateMaintenanceInput>({
    defaultValues: {
      assetId: searchParams.get("assetId") ?? "",
      contractId: "",
      vendorId: "",
      maintenanceType: "",
      requestDate: "",
      remarks: "",
    },
  });

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
      <PageHeader variant="standard"
        title="New maintenance request"
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
                "Provide at least one linked asset, contract, or vendor identifier.",
                "Status progresses on the detail page after creation.",
              ]}
            />
          </>
        }
      >
        <form
          onSubmit={handleSubmit((values) => {
            const parsed = createMaintenanceSchema.safeParse(values);
            if (!parsed.success) {
              toast.error(parsed.error.issues[0]?.message ?? "Invalid form");
              return;
            }
            mutation.mutate(parsed.data);
          })}
          className="flex flex-col gap-6"
          noValidate
        >
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wrench className="h-4 w-4 text-primary" />
                Request details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="assetId">Asset ID</Label>
                <Input id="assetId" {...register("assetId")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contractId">Contract ID</Label>
                <Input id="contractId" {...register("contractId")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vendorId">Vendor ID</Label>
                <Input id="vendorId" {...register("vendorId")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="maintenanceType" required>
                  Type
                </Label>
                <Input id="maintenanceType" error={!!errors.maintenanceType} {...register("maintenanceType")} />
                {errors.maintenanceType ? (
                  <p className="text-xs text-destructive">{errors.maintenanceType.message}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="requestDate" required>
                  Request date
                </Label>
                <Input id="requestDate" type="date" error={!!errors.requestDate} {...register("requestDate")} />
                {errors.requestDate ? (
                  <p className="text-xs text-destructive">{errors.requestDate.message}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cost">Cost (optional)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("cost", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
                />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Input id="remarks" {...register("remarks")} />
              </div>
              {errors.assetId ? (
                <p className="text-xs text-destructive md:col-span-2">{errors.assetId.message}</p>
              ) : null}
            </CardContent>
          </Card>

          <CreateFormActions>
            <Button type="button" variant="outline" size="md" asChild>
              <Link href="/maintenance">Cancel</Link>
            </Button>
            <Button type="submit" size="md" disabled={isSubmitting || mutation.isPending} loading={mutation.isPending}>
              Create request
            </Button>
          </CreateFormActions>
        </form>
      </CreateFormLayout>
    </div>
  );
}

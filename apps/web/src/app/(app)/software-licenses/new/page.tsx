"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, KeyRound } from "lucide-react";

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
  CreateFormPreviewCard,
  CreateFormTips,
  CreateFormValidationCard,
} from "@/components/crud/CreateFormAside";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { createSoftwareLicense, type SoftwareLicense } from "@/lib/api/software-licenses";
import { createLicenseSchema, type CreateLicenseInput } from "@/lib/validators/software-license";
import { ApiClientError } from "@/lib/api/client";

export default function NewSoftwareLicensePage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKeys.licensesManage);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateLicenseInput>({
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
        <form
          onSubmit={handleSubmit((values) => {
            const parsed = createLicenseSchema.safeParse(values);
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
                <KeyRound className="h-4 w-4 text-primary" />
                License information
              </CardTitle>
              <span className="text-xs font-medium text-destructive">* Required</span>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="softwareName" required>
                  Software name
                </Label>
                <Input id="softwareName" error={!!errors.softwareName} {...register("softwareName")} />
                {errors.softwareName ? (
                  <p className="text-xs text-destructive">{errors.softwareName.message}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="licenseKeyReference">Key reference</Label>
                <Input id="licenseKeyReference" {...register("licenseKeyReference")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vendorId">Vendor ID</Label>
                <Input id="vendorId" {...register("vendorId")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="purchaseOrderId">PO ID</Label>
                <Input id="purchaseOrderId" {...register("purchaseOrderId")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="startDate" required>
                  Start
                </Label>
                <Input id="startDate" type="date" error={!!errors.startDate} {...register("startDate")} />
                {errors.startDate ? (
                  <p className="text-xs text-destructive">{errors.startDate.message}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="expiryDate" required>
                  Expiry
                </Label>
                <Input id="expiryDate" type="date" error={!!errors.expiryDate} {...register("expiryDate")} />
                {errors.expiryDate ? (
                  <p className="text-xs text-destructive">{errors.expiryDate.message}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="licenseQuantity">Quantity</Label>
                <Input
                  id="licenseQuantity"
                  type="number"
                  min={1}
                  {...register("licenseQuantity", { valueAsNumber: true })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="renewalCost">Renewal cost</Label>
                <Input
                  id="renewalCost"
                  type="number"
                  step="0.01"
                  {...register("renewalCost", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
                />
              </div>
            </CardContent>
          </Card>

          <CreateFormActions>
            <Button type="button" variant="outline" size="md" asChild>
              <Link href="/software-licenses">Cancel</Link>
            </Button>
            <Button type="submit" size="md" disabled={isSubmitting || mutation.isPending} loading={mutation.isPending}>
              Create license
            </Button>
          </CreateFormActions>
        </form>
      </CreateFormLayout>
    </div>
  );
}

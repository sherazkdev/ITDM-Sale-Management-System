"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
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
import { PolicyNotApprovedNotice } from "@/components/procurement/PolicyNotApprovedNotice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import {
  fetchSoftwareLicense,
  renewSoftwareLicense,
  updateSoftwareLicense,
} from "@/lib/api/software-licenses";
import { updateLicenseSchema, type UpdateLicenseInput } from "@/lib/validators/software-license";
import { ApiClientError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { LICENSE_RENEW_BLOCKED, LICENSE_RENEW_BLOCKED_MESSAGE } from "@/lib/domain/license-ui";

export default function SoftwareLicenseDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKeys.licensesManage);
  const [editOpen, setEditOpen] = useState(false);

  const { data, isError, error } = useQuery({
    queryKey: ["software-licenses", id],
    queryFn: () => fetchSoftwareLicense(id),
  });

  const license = data;

  const editForm = useForm<UpdateLicenseInput>({
    resolver: zodResolver(updateLicenseSchema),
  });

  const updateMutation = useMutation({
    mutationFn: (values: UpdateLicenseInput) => updateSoftwareLicense(id, values),
    onSuccess: () => {
      toast.success("License updated");
      setEditOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["software-licenses"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Update failed"),
  });

  const renewMutation = useMutation({
    mutationFn: () => renewSoftwareLicense(id),
    onSuccess: () => toast.success("Renewed"),
    onError: (err) => {
      if (err instanceof ApiClientError && err.code === "POLICY_NOT_APPROVED") {
        toast.error(LICENSE_RENEW_BLOCKED_MESSAGE);
      } else {
        toast.error(err instanceof ApiClientError ? err.message : "Renew blocked");
      }
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={license?.softwareName ?? "License"}
        breadcrumbs={[{ label: "Licenses", href: "/software-licenses" }, { label: id }]}
        actions={
          <div className="flex flex-wrap gap-2">
            {canManage ? (
              <>
                <Button variant="outline" size="md" onClick={() => setEditOpen(true)}>
                  Edit
                </Button>
                <Button variant="outline" size="md" disabled={LICENSE_RENEW_BLOCKED} onClick={() => renewMutation.mutate()}>
                  Renew
                </Button>
              </>
            ) : null}
            <Button variant="outline" size="md" asChild>
              <Link href="/software-licenses">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        }
      />

      <PolicyNotApprovedNotice title="Renewal unavailable" message={LICENSE_RENEW_BLOCKED_MESSAGE} />

      {isError ? (
        <Card className="p-4 text-sm text-destructive">
          {error instanceof ApiClientError ? error.message : "Failed to load license."}
        </Card>
      ) : null}

      {license ? (
        <>
          <RecordOverviewCard>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold truncate">{license.softwareName}</h2>
                <p className="text-sm text-muted-foreground">Status: {license.status}</p>
              </div>
              <p className="text-sm font-medium tabular">
                Expires {license.expiryDate?.slice(0, 10) ?? "—"}
              </p>
            </div>
          </RecordOverviewCard>

          <DetailRecordLayout
            aside={
              <SectionCard title="Term & procurement">
                <dl className="flex flex-col gap-3">
                  <DetailField label="Start" value={license.startDate?.slice(0, 10) ?? "—"} />
                  <DetailField label="Expiry" value={license.expiryDate?.slice(0, 10) ?? "—"} />
                  <DetailField label="Quantity" value={license.licenseQuantity} />
                  <DetailField
                    label="Renewal cost"
                    value={
                      license.renewalCost != null
                        ? formatCurrency(Number(license.renewalCost), "USD")
                        : "—"
                    }
                  />
                  <DetailField
                    label="Purchase order"
                    value={
                      license.purchaseOrder ? (
                        <Link
                          href={`/purchase-orders/${license.purchaseOrderId}`}
                          className="text-primary hover:underline"
                        >
                          {license.purchaseOrder.poNumber}
                        </Link>
                      ) : (
                        license.purchaseOrderId ?? "—"
                      )
                    }
                  />
                </dl>
              </SectionCard>
            }
          >
            <SectionCard title="License record">
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailField
                  label="Vendor"
                  value={
                    license.vendor ? (
                      <Link href={`/vendors/${license.vendorId}`} className="text-primary hover:underline">
                        {license.vendor.vendorName}
                      </Link>
                    ) : (
                      license.vendorId ?? "—"
                    )
                  }
                />
                <DetailField
                  label="Key reference"
                  value={
                    canManage && license.licenseKeyReference
                      ? license.licenseKeyReference
                      : canManage
                        ? "—"
                        : "Restricted"
                  }
                />
              </dl>
            </SectionCard>
          </DetailRecordLayout>
        </>
      ) : null}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit license</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-3"
            onSubmit={editForm.handleSubmit((v) => updateMutation.mutate(v))}
          >
            <div className="space-y-2">
              <Label>Software name</Label>
              <Input {...editForm.register("softwareName")} defaultValue={license?.softwareName} />
            </div>
            <div className="space-y-2">
              <Label>Expiry</Label>
              <Input type="date" {...editForm.register("expiryDate")} defaultValue={license?.expiryDate?.slice(0, 10)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

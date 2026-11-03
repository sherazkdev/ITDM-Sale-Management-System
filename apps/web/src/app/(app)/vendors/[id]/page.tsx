"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Archive, ArrowLeft, Pencil } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusPill } from "@/components/common/StatusPill";
import {
  DetailField,
  DetailRecordLayout,
  RecordOverviewCard,
} from "@/components/crud/DetailRecordLayout";
import { ConfirmDialog } from "@/components/crud/ConfirmDialog";
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
import { archiveVendor, fetchVendor, updateVendor } from "@/lib/api/vendors";
import { updateVendorSchema, type UpdateVendorInput } from "@/lib/validators/vendor";
import { ApiClientError } from "@/lib/api/client";

export default function VendorDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKeys.vendorsManage);

  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const { data: vendor, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["vendor", id],
    queryFn: () => fetchVendor(id),
    enabled: !!id,
  });

  const editForm = useForm<UpdateVendorInput>({
    resolver: zodResolver(updateVendorSchema),
    values: vendor
      ? {
          vendorName: vendor.vendorName,
          registrationNumber: vendor.registrationNumber ?? "",
          contactPerson: vendor.contactPerson ?? "",
          phone: vendor.phone ?? "",
          email: vendor.email ?? "",
          address: vendor.address ?? "",
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateVendorInput) => updateVendor(id, input),
    onSuccess: () => {
      toast.success("Vendor updated");
      void queryClient.invalidateQueries({ queryKey: ["vendor", id] });
      void queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setEditOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Update failed");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveVendor(id),
    onSuccess: () => {
      toast.success("Vendor archived");
      void queryClient.invalidateQueries({ queryKey: ["vendor", id] });
      void queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setArchiveOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Archive failed");
    },
  });

  const counts = vendor?.relationCounts;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Vendor" description="Loading…" />
        <Card className="h-48 animate-pulse bg-muted/30" />
      </div>
    );
  }

  if (isError || !vendor) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Vendor" />
        <Card className="p-4 text-sm text-destructive">
          {error instanceof ApiClientError ? error.message : "Vendor not found."}{" "}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={vendor.vendorName}
        description="Vendor profile and related records."
        breadcrumbs={[{ label: "Vendors", href: "/vendors" }, { label: vendor.vendorName }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="md" asChild>
              <Link href="/vendors">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            {canManage && vendor.isActive ? (
              <>
                <Button variant="outline" size="md" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button variant="destructive" size="md" onClick={() => setArchiveOpen(true)}>
                  <Archive className="h-4 w-4" />
                  Archive
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      <RecordOverviewCard>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold truncate">{vendor.vendorName}</h2>
            <p className="text-sm text-muted-foreground">
              {vendor.registrationNumber ? `Reg. ${vendor.registrationNumber}` : "Vendor record"}
            </p>
          </div>
          <StatusPill status={vendor.isActive ? "active" : "inactive"} dot />
        </div>
      </RecordOverviewCard>

      <DetailRecordLayout
        aside={
          counts ? (
            <SectionCard title="Related records" description="Linked procurement and operations.">
              <dl className="flex flex-col gap-3">
                <DetailField label="Contracts" value={counts.contracts} />
                <DetailField label="Purchase orders" value={counts.purchaseOrders} />
                <DetailField label="Maintenance" value={counts.maintenanceRecords} />
                <DetailField label="Software licenses" value={counts.softwareLicenses} />
              </dl>
            </SectionCard>
          ) : undefined
        }
      >
        <SectionCard title="Contact & address">
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Contact person" value={vendor.contactPerson ?? "—"} />
            <DetailField label="Phone" value={vendor.phone ?? "—"} />
            <DetailField label="Email" value={vendor.email ?? "—"} />
            <DetailField label="Address" value={vendor.address ?? "—"} />
          </dl>
        </SectionCard>
      </DetailRecordLayout>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit vendor</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))}
            className="flex flex-col gap-4"
            noValidate
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-vendorName">Vendor name</Label>
              <Input id="edit-vendorName" {...editForm.register("vendorName")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-reg">Registration</Label>
                <Input id="edit-reg" {...editForm.register("registrationNumber")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-contact">Contact person</Label>
                <Input id="edit-contact" {...editForm.register("contactPerson")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input id="edit-phone" {...editForm.register("phone")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" {...editForm.register("email")} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-address">Address</Label>
              <Input id="edit-address" {...editForm.register("address")} />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archive vendor?"
        description={`${vendor.vendorName} will be marked inactive. Existing linked records remain unchanged.`}
        confirmLabel="Archive"
        destructive
        loading={archiveMutation.isPending}
        onConfirm={() => archiveMutation.mutate()}
      />
    </div>
  );
}

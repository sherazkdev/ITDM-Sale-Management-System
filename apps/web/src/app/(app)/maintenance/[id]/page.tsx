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
import { StatusPill } from "@/components/common/StatusPill";
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
  completeMaintenanceRecord,
  fetchMaintenanceRecord,
  updateMaintenanceRecord,
} from "@/lib/api/maintenance";
import {
  completeMaintenanceSchema,
  updateMaintenanceSchema,
  type CompleteMaintenanceInput,
  type UpdateMaintenanceInput,
} from "@/lib/validators/maintenance";
import { ApiClientError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { MAINTENANCE_STATUS_LABELS, maintenanceStatusToPill } from "@/lib/domain/maintenance-ui";

export default function MaintenanceDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKeys.maintenanceManage);
  const [editOpen, setEditOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["maintenance-records", id],
    queryFn: () => fetchMaintenanceRecord(id),
  });

  const record = data;
  const closed = record?.status === "COMPLETED" || record?.status === "CANCELLED";

  const editForm = useForm<UpdateMaintenanceInput>({
    resolver: zodResolver(updateMaintenanceSchema),
  });

  const completeForm = useForm<CompleteMaintenanceInput>({
    resolver: zodResolver(completeMaintenanceSchema),
    defaultValues: { completionDate: "", cost: undefined, remarks: "" },
  });

  const updateMutation = useMutation({
    mutationFn: (values: UpdateMaintenanceInput) => updateMaintenanceRecord(id, values),
    onSuccess: () => {
      toast.success("Updated");
      setEditOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Update failed"),
  });

  const completeMutation = useMutation({
    mutationFn: (values: CompleteMaintenanceInput) => completeMaintenanceRecord(id, values),
    onSuccess: () => {
      toast.success("Maintenance completed");
      setCompleteOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Complete failed"),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={record?.maintenanceType ?? "Maintenance"}
        breadcrumbs={[{ label: "Maintenance", href: "/maintenance" }, { label: id }]}
        actions={
          <div className="flex flex-wrap gap-2">
            {canManage && record && !closed ? (
              <>
                <Button variant="outline" size="md" onClick={() => setEditOpen(true)}>
                  Edit
                </Button>
                <Button size="md" onClick={() => setCompleteOpen(true)}>
                  Complete
                </Button>
              </>
            ) : null}
            <Button variant="outline" size="md" asChild>
              <Link href="/maintenance">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        }
      />

      {isError ? (
        <Card className="p-4 text-sm text-destructive">
          {error instanceof ApiClientError ? error.message : "Failed to load."}
        </Card>
      ) : null}

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}

      {record ? (
        <>
          <RecordOverviewCard>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold truncate">{record.maintenanceType}</h2>
                <p className="text-sm text-muted-foreground">
                  Requested {record.requestDate?.slice(0, 10) ?? "—"}
                </p>
              </div>
              <StatusPill
                status={maintenanceStatusToPill(record.status)}
                label={MAINTENANCE_STATUS_LABELS[record.status] ?? record.status}
                dot
              />
            </div>
          </RecordOverviewCard>

          <DetailRecordLayout
            aside={
              <SectionCard title="Related records">
                <dl className="flex flex-col gap-3">
                  <DetailField
                    label="Asset"
                    value={
                      record.asset ? (
                        <Link href={`/assets/${record.assetId}`} className="text-primary hover:underline">
                          {record.asset.assetCode}
                        </Link>
                      ) : (
                        record.assetId ?? "—"
                      )
                    }
                  />
                  <DetailField
                    label="Vendor"
                    value={record.vendor?.vendorName ?? record.vendorId ?? "—"}
                  />
                  <DetailField
                    label="Contract"
                    value={
                      record.contract ? (
                        <Link
                          href={`/contracts/${record.contractId}`}
                          className="text-primary hover:underline"
                        >
                          {record.contract.contractNumber}
                        </Link>
                      ) : (
                        record.contractId ?? "—"
                      )
                    }
                  />
                </dl>
              </SectionCard>
            }
          >
            <SectionCard title="Work details">
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailField label="Completion date" value={record.completionDate?.slice(0, 10) ?? "—"} />
                <DetailField
                  label="Cost"
                  value={record.cost != null ? formatCurrency(Number(record.cost), "USD") : "—"}
                />
                <DetailField label="Remarks" value={record.remarks ?? "—"} />
              </dl>
            </SectionCard>
          </DetailRecordLayout>
        </>
      ) : null}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit maintenance</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-3"
            onSubmit={editForm.handleSubmit((v) => updateMutation.mutate(v))}
          >
            <div className="space-y-2">
              <Label>Type</Label>
              <Input {...editForm.register("maintenanceType")} defaultValue={record?.maintenanceType} />
            </div>
            <div className="space-y-2">
              <Label>Cost</Label>
              <Input type="number" step="0.01" {...editForm.register("cost")} />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Input {...editForm.register("remarks")} defaultValue={record?.remarks ?? ""} />
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

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete maintenance</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-3"
            onSubmit={completeForm.handleSubmit((v) => completeMutation.mutate(v))}
          >
            <div className="space-y-2">
              <Label>Completion date</Label>
              <Input type="date" {...completeForm.register("completionDate")} />
            </div>
            <div className="space-y-2">
              <Label>Final cost (optional)</Label>
              <Input type="number" step="0.01" {...completeForm.register("cost")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCompleteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={completeMutation.isPending}>
                Complete
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

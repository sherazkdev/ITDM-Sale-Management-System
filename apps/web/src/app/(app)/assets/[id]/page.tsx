"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Archive, Pencil } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusPill } from "@/components/common/StatusPill";
import {
  DetailField,
  DetailRecordLayout,
  RecordOverviewCard,
} from "@/components/crud/DetailRecordLayout";
import { DataTable, type Column } from "@/components/common/DataTable";
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
import {
  fetchAsset,
  fetchAssetCurrentHolder,
  fetchAssetHistory,
  retireAsset,
  updateAssetMetadata,
  type AssetHistoryRow,
} from "@/lib/api/assets";
import { updateAssetMetadataSchema, type UpdateAssetMetadataInput } from "@/lib/validators/asset";
import { ASSET_STATUS_LABELS, assetStatusToPill } from "@/lib/domain/asset-status-ui";
import { ApiClientError } from "@/lib/api/client";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default function AssetDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKeys.assetsManage);
  const canSeeFinancials =
    hasPermission(PermissionKeys.assetsManage) ||
    hasPermission(PermissionKeys.assetsFinancialsRead) ||
    hasPermission(PermissionKeys.invoicesRead);

  const [editOpen, setEditOpen] = useState(false);
  const [retireOpen, setRetireOpen] = useState(false);

  const { data: asset, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["asset", id],
    queryFn: () => fetchAsset(id),
    enabled: !!id,
  });

  const { data: holder } = useQuery({
    queryKey: ["asset", id, "holder"],
    queryFn: () => fetchAssetCurrentHolder(id),
    enabled: !!id,
  });

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ["asset", id, "history"],
    queryFn: () => fetchAssetHistory(id),
    enabled: !!id,
  });

  const editForm = useForm<UpdateAssetMetadataInput>({
    resolver: zodResolver(updateAssetMetadataSchema),
    values: asset
      ? {
          assetName: asset.assetName,
          serialNumber: asset.serialNumber ?? "",
          currentLocation: asset.currentLocation ?? "",
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateAssetMetadataInput) => updateAssetMetadata(id, input),
    onSuccess: () => {
      toast.success("Asset updated");
      void queryClient.invalidateQueries({ queryKey: ["asset", id] });
      void queryClient.invalidateQueries({ queryKey: ["assets"] });
      setEditOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Update failed");
    },
  });

  const retireMutation = useMutation({
    mutationFn: () => retireAsset(id),
    onSuccess: () => {
      toast.success("Asset retired");
      void queryClient.invalidateQueries({ queryKey: ["asset", id] });
      void queryClient.invalidateQueries({ queryKey: ["assets"] });
      setRetireOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Retire failed");
    },
  });

  const historyColumns: Column<AssetHistoryRow>[] = useMemo(
    () => [
      {
        key: "transactionDate",
        header: "Date",
        cell: (row) => formatDateTime(row.transactionDate),
      },
      {
        key: "transactionType",
        header: "Type",
        cell: (row) => row.transactionType.replace(/_/g, " "),
      },
      {
        key: "employee",
        header: "Employee",
        cell: (row) =>
          row.employee ? (
            <Link href={`/employees/${row.employee.employeeId}`} className="text-primary hover:underline">
              {row.employee.fullName}
            </Link>
          ) : (
            "—"
          ),
      },
      {
        key: "movementDocument",
        header: "Document",
        cell: (row) => row.movementDocument?.documentNumber ?? "—",
      },
    ],
    [],
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Asset" description="Loading…" />
        <Card className="h-48 animate-pulse bg-muted/30" />
      </div>
    );
  }

  if (isError || !asset) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Asset" />
        <Card className="p-4 text-sm text-destructive">
          {error instanceof ApiClientError ? error.message : "Asset not found."}{" "}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const canRetire = canManage && asset.assetStatus === "IN_STOCK";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={asset.assetName}
        description={`Asset ${asset.assetCode}`}
        breadcrumbs={[{ label: "Assets", href: "/assets" }, { label: asset.assetCode }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="md" asChild>
              <Link href="/assets">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            {canManage ? (
              <Button variant="outline" size="md" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Edit metadata
              </Button>
            ) : null}
            {canRetire ? (
              <Button variant="destructive" size="md" onClick={() => setRetireOpen(true)}>
                <Archive className="h-4 w-4" />
                Retire
              </Button>
            ) : null}
          </div>
        }
      />

      <RecordOverviewCard>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold truncate">{asset.assetName}</h2>
            <p className="text-sm text-muted-foreground font-medium tabular">{asset.assetCode}</p>
          </div>
          <StatusPill
            status={assetStatusToPill(asset.assetStatus)}
            label={ASSET_STATUS_LABELS[asset.assetStatus] ?? asset.assetStatus}
            dot
          />
        </div>
      </RecordOverviewCard>

      <DetailRecordLayout
        aside={
          <SectionCard title="Current holder" description="Employee holding this asset, if issued.">
            {holder ? (
              <p className="text-sm">
                <Link
                  href={`/employees/${holder.employeeId}`}
                  className="font-medium text-primary hover:underline"
                >
                  {holder.fullName}
                </Link>
                <span className="text-muted-foreground"> · #{holder.employeeNumber}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Not currently issued to an employee.</p>
            )}
          </SectionCard>
        }
      >
        <SectionCard title="Register details">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Code" value={asset.assetCode} />
            <DetailField label="Category" value={asset.category?.categoryName ?? "—"} />
            <DetailField label="Serial number" value={asset.serialNumber ?? "—"} />
            <DetailField label="Location" value={asset.currentLocation ?? "—"} />
            <DetailField label="Purchase date" value={asset.purchaseDate ?? "—"} />
            {canSeeFinancials ? (
              <DetailField
                label="Purchase cost"
                value={
                  asset.purchaseCost != null && asset.purchaseCost !== ""
                    ? asset.purchaseCost
                    : "—"
                }
              />
            ) : null}
          </dl>
        </SectionCard>

        <SectionCard title="Movement history" flush>
          <DataTable
            data={history}
            columns={historyColumns}
            getRowId={(row) => row.transactionId}
            loading={historyLoading}
            empty={<p className="p-6 text-sm text-muted-foreground">No movement history yet.</p>}
          />
        </SectionCard>
      </DetailRecordLayout>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit metadata</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))}
            className="flex flex-col gap-4"
            noValidate
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-assetName">Asset name</Label>
              <Input id="edit-assetName" {...editForm.register("assetName")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-serial">Serial number</Label>
              <Input id="edit-serial" {...editForm.register("serialNumber")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-location">Location</Label>
              <Input id="edit-location" {...editForm.register("currentLocation")} />
            </div>
            {editForm.formState.errors.root ? (
              <p className="text-xs text-destructive">{editForm.formState.errors.root.message}</p>
            ) : null}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={retireOpen}
        onOpenChange={setRetireOpen}
        title="Retire asset?"
        description={`${asset.assetCode} will be marked retired and removed from active stock.`}
        confirmLabel="Retire"
        destructive
        loading={retireMutation.isPending}
        onConfirm={() => retireMutation.mutate()}
      />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Pencil } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import {
  DetailField,
  DetailRecordLayout,
  RecordOverviewCard,
} from "@/components/crud/DetailRecordLayout";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusPill } from "@/components/common/StatusPill";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterSelect } from "@/components/common/FilterSelect";
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
  fetchContract,
  fetchContractPurchaseOrders,
  updateContract,
  type PurchaseOrderSummary,
} from "@/lib/api/contracts";
import { fetchVendors } from "@/lib/api/vendors";
import { updateContractSchema, type UpdateContractInput } from "@/lib/validators/contract";
import { ApiClientError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { poStatusToPill } from "@/lib/domain/purchase-order-ui";

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id ?? "");
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKeys.contractsManage);

  const [editOpen, setEditOpen] = useState(false);

  const { data: contract, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["contract", id],
    queryFn: () => fetchContract(id),
    enabled: !!id,
  });

  const { data: relatedPos, isLoading: posLoading } = useQuery({
    queryKey: ["contract", id, "purchase-orders"],
    queryFn: () => fetchContractPurchaseOrders(id),
    enabled: !!id,
  });

  const { data: vendorPage } = useQuery({
    queryKey: ["vendors", "select", "contract-edit"],
    queryFn: () => fetchVendors({ page: 1, pageSize: 100, isActive: true }),
    enabled: editOpen,
  });

  const vendorOptions = (vendorPage?.data ?? []).map((v) => ({
    value: v.vendorId,
    label: v.vendorName,
  }));

  const editForm = useForm<UpdateContractInput>({
    resolver: zodResolver(updateContractSchema),
    values: contract
      ? {
          vendorId: contract.vendorId,
          startDate: contract.startDate,
          expiryDate: contract.expiryDate,
          contractValue:
            contract.contractValue != null ? Number(contract.contractValue) : undefined,
          renewalStatus: contract.renewalStatus ?? "",
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateContractInput) => updateContract(id, input),
    onSuccess: () => {
      toast.success("Contract updated");
      void queryClient.invalidateQueries({ queryKey: ["contract", id] });
      void queryClient.invalidateQueries({ queryKey: ["contracts"] });
      setEditOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Update failed");
    },
  });

  const poColumns: Column<PurchaseOrderSummary>[] = [
    {
      key: "poNumber",
      header: "PO number",
      cell: (po) => <span className="font-medium">{po.poNumber}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (po) => <StatusPill status={poStatusToPill(po.status)} dot />,
    },
    {
      key: "totalAmount",
      header: "Total",
      cell: (po) => formatCurrency(Number(po.totalAmount), po.currency),
    },
    {
      key: "poDate",
      header: "Date",
      hideOnMobile: true,
      cell: (po) => po.poDate,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Contract" description="Loading…" />
        <Card className="h-48 animate-pulse bg-muted/30" />
      </div>
    );
  }

  if (isError || !contract) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Contract" />
        <Card className="p-4 text-sm text-destructive">
          {error instanceof ApiClientError ? error.message : "Contract not found."}{" "}
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
        title={contract.contractNumber}
        description={contract.vendor?.vendorName ?? "Contract detail"}
        breadcrumbs={[
          { label: "Contracts", href: "/contracts" },
          { label: contract.contractNumber },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="md" asChild>
              <Link href="/contracts">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            {canManage ? (
              <Button variant="outline" size="md" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            ) : null}
          </div>
        }
      />

      <RecordOverviewCard>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold truncate">{contract.contractNumber}</h2>
            <p className="text-sm text-muted-foreground truncate">
              {contract.vendor?.vendorName ?? contract.vendorId}
            </p>
          </div>
          <p className="text-sm font-medium tabular">
            {contract.contractValue != null
              ? formatCurrency(Number(contract.contractValue))
              : "—"}
          </p>
        </div>
      </RecordOverviewCard>

      <DetailRecordLayout
        aside={
          <SectionCard title="Term">
            <dl className="flex flex-col gap-3">
              <DetailField label="Start date" value={contract.startDate} />
              <DetailField label="Expiry date" value={contract.expiryDate} />
              <DetailField label="Renewal status" value={contract.renewalStatus ?? "—"} />
            </dl>
          </SectionCard>
        }
      >
        <SectionCard title="Contract details">
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Vendor" value={contract.vendor?.vendorName ?? contract.vendorId} />
            <DetailField
              label="Document path"
              value={contract.documentPath?.trim() ? contract.documentPath : "—"}
            />
          </dl>
        </SectionCard>

        <SectionCard title="Related purchase orders">
          <DataTable
            data={relatedPos ?? []}
            columns={poColumns}
            getRowId={(po) => po.purchaseOrderId}
            loading={posLoading}
            onRowClick={(po) => router.push(`/purchase-orders/${po.purchaseOrderId}`)}
            empty={
              <p className="py-6 text-center text-sm text-muted-foreground">
                No purchase orders linked to this contract.
              </p>
            }
          />
        </SectionCard>
      </DetailRecordLayout>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit contract</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))}
            className="flex flex-col gap-4"
            noValidate
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-vendor">Vendor</Label>
              <Controller
                control={editForm.control}
                name="vendorId"
                render={({ field }) => (
                  <FilterSelect
                    aria-label="Vendor"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Select vendor"
                    options={vendorOptions}
                  />
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-start">Start date</Label>
                <Input id="edit-start" type="date" {...editForm.register("startDate")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-expiry">Expiry date</Label>
                <Input id="edit-expiry" type="date" {...editForm.register("expiryDate")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-value">Contract value</Label>
                <Input id="edit-value" type="number" min={0} step="0.01" {...editForm.register("contractValue")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-renewal">Renewal status</Label>
                <Input id="edit-renewal" {...editForm.register("renewalStatus")} />
              </div>
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
    </div>
  );
}

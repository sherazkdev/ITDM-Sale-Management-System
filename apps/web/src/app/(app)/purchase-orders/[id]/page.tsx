"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import {
  DetailField,
  DetailRecordLayout,
  RecordOverviewCard,
} from "@/components/crud/DetailRecordLayout";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusPill } from "@/components/common/StatusPill";
import { ConfirmDialog } from "@/components/crud/ConfirmDialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import {
  addPurchaseOrderLine,
  fetchPurchaseOrder,
  removePurchaseOrderLine,
  type PurchaseOrderLine,
} from "@/lib/api/purchase-orders";
import {
  purchaseOrderLineSchema,
  type PurchaseOrderLineInput,
} from "@/lib/validators/purchase-order";
import { ApiClientError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { D03_POLICY_MESSAGE, PO_STATUS_LABELS, PO_WORKFLOW_BLOCKED, poStatusToPill } from "@/lib/domain/purchase-order-ui";

function WorkflowActionButton({
  label,
  disabled,
  tooltip,
  onClick,
}: {
  label: string;
  disabled: boolean;
  tooltip: string;
  onClick?: () => void;
}) {
  const button = (
    <Button variant="outline" size="md" disabled={disabled} onClick={disabled ? undefined : onClick}>
      {label}
    </Button>
  );

  if (!disabled) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{button}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKeys.purchaseOrdersManage);

  const [lineOpen, setLineOpen] = useState(false);
  const [removeLineId, setRemoveLineId] = useState<string | null>(null);

  const { data: po, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["purchase-order", id],
    queryFn: () => fetchPurchaseOrder(id),
    enabled: !!id,
  });

  const isDraft = po?.status === "DRAFT";
  const workflowTooltip = D03_POLICY_MESSAGE;

  const lineForm = useForm<PurchaseOrderLineInput>({
    resolver: zodResolver(purchaseOrderLineSchema),
    defaultValues: {
      lineNumber: (po?.lines?.length ?? 0) + 1,
      description: "",
      lineType: "goods",
      quantity: 1,
      unitPrice: 0,
    },
  });

  const invalidatePo = () => {
    void queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
    void queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
  };

  const addLineMutation = useMutation({
    mutationFn: (input: PurchaseOrderLineInput) => addPurchaseOrderLine(id, input),
    onSuccess: () => {
      toast.success("Line added");
      invalidatePo();
      setLineOpen(false);
      lineForm.reset({
        lineNumber: (po?.lines?.length ?? 0) + 2,
        description: "",
        lineType: "goods",
        quantity: 1,
        unitPrice: 0,
      });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to add line");
    },
  });

  const removeLineMutation = useMutation({
    mutationFn: (lineId: string) => removePurchaseOrderLine(id, lineId),
    onSuccess: () => {
      toast.success("Line removed");
      invalidatePo();
      setRemoveLineId(null);
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to remove line");
    },
  });

  const lineColumns: Column<PurchaseOrderLine>[] = [
    {
      key: "lineNumber",
      header: "#",
      cell: (line) => line.lineNumber,
    },
    {
      key: "description",
      header: "Description",
      cell: (line) => line.description,
    },
    {
      key: "lineType",
      header: "Type",
      hideOnMobile: true,
      cell: (line) => line.lineType,
    },
    {
      key: "quantity",
      header: "Qty",
      cell: (line) => Number(line.quantity),
    },
    {
      key: "unitPrice",
      header: "Unit price",
      hideOnMobile: true,
      cell: (line) =>
        po ? formatCurrency(Number(line.unitPrice), po.currency) : Number(line.unitPrice),
    },
    {
      key: "lineSubtotal",
      header: "Subtotal",
      cell: (line) =>
        po ? formatCurrency(Number(line.lineSubtotal), po.currency) : Number(line.lineSubtotal),
    },
    ...(canManage && isDraft
      ? [
          {
            key: "actions",
            header: "",
            cell: (line: PurchaseOrderLine) => (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Remove line"
                onClick={(e) => {
                  e.stopPropagation();
                  setRemoveLineId(line.purchaseOrderLineId);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            ),
          } satisfies Column<PurchaseOrderLine>,
        ]
      : []),
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Purchase order" description="Loading…" />
        <Card className="h-48 animate-pulse bg-muted/30" />
      </div>
    );
  }

  if (isError || !po) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Purchase order" />
        <Card className="p-4 text-sm text-destructive">
          {error instanceof ApiClientError ? error.message : "Purchase order not found."}{" "}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col gap-6">
        <PageHeader
          title={po.poNumber}
          description={po.vendor?.vendorName ?? "Purchase order detail"}
          breadcrumbs={[
            { label: "Purchase orders", href: "/purchase-orders" },
            { label: po.poNumber },
          ]}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="md" asChild>
                <Link href="/purchase-orders">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
              {canManage ? (
                <>
                  <WorkflowActionButton
                    label="Submit"
                    disabled={PO_WORKFLOW_BLOCKED || !isDraft}
                    tooltip={workflowTooltip}
                  />
                  <WorkflowActionButton
                    label="Approve"
                    disabled={PO_WORKFLOW_BLOCKED}
                    tooltip={workflowTooltip}
                  />
                  <WorkflowActionButton
                    label="Cancel PO"
                    disabled={PO_WORKFLOW_BLOCKED}
                    tooltip={workflowTooltip}
                  />
                </>
              ) : null}
            </div>
          }
        />

        {PO_WORKFLOW_BLOCKED ? <PolicyNotApprovedNotice message={D03_POLICY_MESSAGE} /> : null}

        <RecordOverviewCard>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold truncate">{po.poNumber}</h2>
              <p className="text-sm text-muted-foreground truncate">
                {po.vendor?.vendorName ?? po.vendorId}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill
                status={poStatusToPill(po.status)}
                label={PO_STATUS_LABELS[po.status] ?? po.status}
                dot
              />
              <span className="text-sm font-semibold tabular">
                {formatCurrency(Number(po.totalAmount), po.currency)}
              </span>
            </div>
          </div>
        </RecordOverviewCard>

        <DetailRecordLayout
          aside={
            <SectionCard title="Header">
              <dl className="flex flex-col gap-3">
                <DetailField label="PO date" value={po.poDate} />
                <DetailField label="Valid until" value={po.validUntil ?? "—"} />
                <DetailField
                  label="Contract"
                  value={
                    po.contract ? (
                      <Link
                        href={`/contracts/${po.contract.contractId}`}
                        className="text-primary hover:underline"
                      >
                        {po.contract.contractNumber}
                      </Link>
                    ) : (
                      "—"
                    )
                  }
                />
                <DetailField
                  label="Document path"
                  value={po.documentPath?.trim() ? po.documentPath : "—"}
                />
              </dl>
            </SectionCard>
          }
        >
          <SectionCard
            title="Lines"
            flush
            action={
              canManage && isDraft ? (
                <Button
                  size="sm"
                  onClick={() => {
                    lineForm.reset({
                      lineNumber: (po.lines?.length ?? 0) + 1,
                      description: "",
                      lineType: "goods",
                      quantity: 1,
                      unitPrice: 0,
                    });
                    setLineOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add line
                </Button>
              ) : null
            }
          >
            <DataTable
              data={po.lines ?? []}
              columns={lineColumns}
              getRowId={(line) => line.purchaseOrderLineId}
              empty={
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No lines yet.{isDraft && canManage ? " Add a line to build this draft." : ""}
                </p>
              }
            />
          </SectionCard>
        </DetailRecordLayout>

        <Dialog open={lineOpen} onOpenChange={setLineOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add line</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={lineForm.handleSubmit((values) => addLineMutation.mutate(values))}
              className="flex flex-col gap-4"
              noValidate
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lineNumber">Line number</Label>
                  <Input
                    id="lineNumber"
                    type="number"
                    min={1}
                    error={!!lineForm.formState.errors.lineNumber}
                    {...lineForm.register("lineNumber")}
                  />
                  {lineForm.formState.errors.lineNumber ? (
                    <p className="text-xs text-destructive">
                      {lineForm.formState.errors.lineNumber.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lineType">Line type</Label>
                  <Input id="lineType" {...lineForm.register("lineType")} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  error={!!lineForm.formState.errors.description}
                  {...lineForm.register("description")}
                />
                {lineForm.formState.errors.description ? (
                  <p className="text-xs text-destructive">
                    {lineForm.formState.errors.description.message}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={0}
                    step="any"
                    error={!!lineForm.formState.errors.quantity}
                    {...lineForm.register("quantity")}
                  />
                  {lineForm.formState.errors.quantity ? (
                    <p className="text-xs text-destructive">
                      {lineForm.formState.errors.quantity.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="unitPrice">Unit price</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    min={0}
                    step="0.01"
                    error={!!lineForm.formState.errors.unitPrice}
                    {...lineForm.register("unitPrice")}
                  />
                  {lineForm.formState.errors.unitPrice ? (
                    <p className="text-xs text-destructive">
                      {lineForm.formState.errors.unitPrice.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setLineOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={addLineMutation.isPending}>
                  Add line
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!removeLineId}
          onOpenChange={(open) => !open && setRemoveLineId(null)}
          title="Remove line?"
          description="This line will be removed from the draft purchase order."
          confirmLabel="Remove"
          destructive
          loading={removeLineMutation.isPending}
          onConfirm={() => {
            if (removeLineId) removeLineMutation.mutate(removeLineId);
          }}
        />
      </div>
    </TooltipProvider>
  );
}

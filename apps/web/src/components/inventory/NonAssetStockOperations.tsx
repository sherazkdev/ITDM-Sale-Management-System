"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { SectionCard } from "@/components/common/SectionCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { FormField } from "@/components/forms/FormField";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { ConfirmDialog } from "@/components/crud/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchNonAssetStockMovements,
  issueNonAssetStock,
  replenishNonAssetStock,
  returnNonAssetStock,
  writeOffNonAssetStock,
  type NonAssetStockItem,
  type NonAssetStockMovement,
} from "@/lib/api/non-asset-stock";
import { fetchEmployees } from "@/lib/api/employees";
import { ApiClientError } from "@/lib/api/client";

type ActionKind = "issue" | "return" | "replenish" | "writeOff" | null;

type MovementForm = {
  quantity: string;
  employeeId: string;
  department: string;
  referenceReason: string;
};

const EMPTY: MovementForm = { quantity: "", employeeId: "", department: "", referenceReason: "" };

export function NonAssetStockOperations({ item, canManage }: { item: NonAssetStockItem; canManage: boolean }) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<ActionKind>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const movementsQuery = useQuery({
    queryKey: ["non-asset-stock", item.stockItemId, "movements"],
    queryFn: () => fetchNonAssetStockMovements(item.stockItemId),
  });

  const employeesQuery = useQuery({
    queryKey: ["employees", "select", "non-asset-stock"],
    queryFn: () => fetchEmployees({ page: 1, pageSize: 200, isActive: true }),
    enabled: canManage && (action === "issue" || action === "return"),
  });

  const { register, handleSubmit, control, reset, watch } = useForm<MovementForm>({ defaultValues: EMPTY });
  const quantity = watch("quantity");

  const movementMutation = useMutation({
    mutationFn: async (values: MovementForm) => {
      const qty = Number(values.quantity);
      const body = {
        quantity: qty,
        referenceReason: values.referenceReason.trim() || undefined,
        employeeId: values.employeeId || undefined,
        department: values.department.trim() || undefined,
        idempotencyKey: crypto.randomUUID(),
      };
      if (action === "issue") return issueNonAssetStock(item.stockItemId, body);
      if (action === "return") return returnNonAssetStock(item.stockItemId, body);
      if (action === "replenish") return replenishNonAssetStock(item.stockItemId, { quantity: qty, referenceReason: body.referenceReason, idempotencyKey: body.idempotencyKey });
      if (action === "writeOff") return writeOffNonAssetStock(item.stockItemId, { quantity: qty, referenceReason: body.referenceReason, idempotencyKey: body.idempotencyKey });
      throw new Error("No action");
    },
    onSuccess: () => {
      toast.success("Stock updated");
      void queryClient.invalidateQueries({ queryKey: ["non-asset-stock", item.stockItemId] });
      void queryClient.invalidateQueries({ queryKey: ["non-asset-stock"] });
      setConfirmOpen(false);
      setAction(null);
      reset(EMPTY);
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Movement failed"),
  });

  const employeeOptions = (employeesQuery.data?.data ?? []).map((e) => ({
    value: e.employeeId,
    label: `${e.fullName} (${e.employeeNumber})`,
    hint: e.department ?? undefined,
  }));

  const columns: Column<NonAssetStockMovement>[] = [
    { key: "type", header: "Type", cell: (r) => r.movementType.replace(/_/g, " ") },
    { key: "qty", header: "Qty", cell: (r) => `${r.quantity} ${item.unitOfMeasure}` },
    {
      key: "recipient",
      header: "Recipient",
      hideOnMobile: true,
      cell: (r) => r.employee?.fullName ?? r.department ?? "—",
    },
    { key: "at", header: "When", cell: (r) => new Date(r.createdAt).toLocaleString() },
    { key: "ref", header: "Reference", hideOnMobile: true, cell: (r) => r.referenceReason ?? "—" },
  ];

  const actionTitle =
    action === "issue"
      ? "Issue stock"
      : action === "return"
        ? "Return stock"
        : action === "replenish"
          ? "Add stock"
          : action === "writeOff"
            ? "Write off stock"
            : "";

  return (
    <div className="flex flex-col gap-6">
      {canManage ? (
        <SectionCard title="Stock actions">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={action === "issue" ? "default" : "outline"} onClick={() => setAction("issue")}>
              Issue stock
            </Button>
            <Button size="sm" variant={action === "return" ? "default" : "outline"} onClick={() => setAction("return")}>
              Return stock
            </Button>
            <Button size="sm" variant={action === "replenish" ? "default" : "outline"} onClick={() => setAction("replenish")}>
              Add stock
            </Button>
            <Button size="sm" variant={action === "writeOff" ? "default" : "outline"} onClick={() => setAction("writeOff")}>
              Write off
            </Button>
          </div>
          {action ? (
            <form
              className="mt-4 grid gap-4 md:grid-cols-2"
              onSubmit={handleSubmit(() => setConfirmOpen(true))}
            >
              <p className="text-sm text-muted-foreground md:col-span-2">
                Available: <strong>{item.quantityAvailable}</strong> {item.unitOfMeasure}
              </p>
              <FormField label={`Quantity (${item.unitOfMeasure})`} htmlFor="qty" required>
                <Input id="qty" type="number" step="0.0001" min="0" {...register("quantity", { required: true })} />
              </FormField>
              {(action === "issue" || action === "return") && (
                <>
                  <FormField label="Employee" hint="Or use department below">
                    <Controller
                      control={control}
                      name="employeeId"
                      render={({ field }) => (
                        <SearchableSelect
                          aria-label="Employee"
                          value={field.value}
                          onChange={field.onChange}
                          options={[{ value: "", label: "None" }, ...employeeOptions]}
                          placeholder="Search employees…"
                        />
                      )}
                    />
                  </FormField>
                  <FormField label="Department" htmlFor="dept" hint="Required if employee not selected">
                    <Input id="dept" {...register("department")} placeholder="e.g. IT Operations" />
                  </FormField>
                </>
              )}
              <FormField label="Reference / reason" htmlFor="ref" className="md:col-span-2">
                <Input id="ref" {...register("referenceReason")} />
              </FormField>
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit">{`Review ${actionTitle.toLowerCase()}`}</Button>
                <Button type="button" variant="outline" onClick={() => { setAction(null); reset(EMPTY); }}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title={actionTitle}
            description={`Apply ${quantity || "?"} ${item.unitOfMeasure} as ${actionTitle.toLowerCase()}?`}
            confirmLabel="Confirm"
            loading={movementMutation.isPending}
            onConfirm={() => {
              void handleSubmit((v) => movementMutation.mutate(v))();
            }}
          />
        </SectionCard>
      ) : null}

      <SectionCard title="Movement history" flush>
        <DataTable
          data={movementsQuery.data?.data ?? []}
          columns={columns}
          getRowId={(r) => r.movementId}
          loading={movementsQuery.isLoading}
          empty={<p className="p-4 text-sm text-muted-foreground">No movements recorded.</p>}
          tableId="non-asset-movements"
          sortMode="off"
        />
      </SectionCard>
    </div>
  );
}

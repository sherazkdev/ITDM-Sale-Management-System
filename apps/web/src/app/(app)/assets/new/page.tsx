"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Package } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
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
import { registerAsset, type Asset } from "@/lib/api/assets";
import { registerNonAssetStockItem } from "@/lib/api/non-asset-stock";
import { fetchAssetCategories } from "@/lib/api/asset-categories";
import { fetchPurchaseOrders } from "@/lib/api/purchase-orders";
import { registerAssetSchema, type RegisterAssetInput } from "@/lib/validators/asset";
import {
  registerNonAssetStockSchema,
  UNITS_OF_MEASURE,
  type RegisterNonAssetStockInput,
} from "@/lib/validators/non-asset-stock";
import { ApiClientError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";
import { SearchableSelect } from "@/components/forms/SearchableSelect";

type EntryKind = "asset" | "non_asset";

export default function NewAssetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = useAuth();
  const [entryKind, setEntryKind] = useState<EntryKind>(
    searchParams.get("kind") === "non_asset" ? "non_asset" : "asset",
  );
  const canManage = hasPermission(PermissionKeys.assetsManage);
  const canSeePurchaseCost =
    hasPermission(PermissionKeys.assetsManage) ||
    hasPermission(PermissionKeys.assetsFinancialsRead) ||
    hasPermission(PermissionKeys.invoicesRead);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["asset-categories"],
    queryFn: fetchAssetCategories,
  });

  const { data: poPage } = useQuery({
    queryKey: ["purchase-orders", "stock-entry"],
    queryFn: () => fetchPurchaseOrders({ page: 1, pageSize: 50 }),
    enabled: entryKind === "non_asset",
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<RegisterAssetInput>({
    resolver: zodResolver(registerAssetSchema),
    defaultValues: {
      assetCode: "",
      assetName: "",
      categoryId: "",
      serialNumber: "",
      purchaseOrderId: "",
      purchaseOrderLineId: "",
      purchaseDate: "",
      currentLocation: "",
    },
  });

  const preview = watch();

  const mutation = useMutation({
    mutationFn: registerAsset,
    onSuccess: (asset: Asset) => {
      toast.success("Asset registered");
      router.push(`/assets/${asset.assetId}`);
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Registration failed");
    },
  });

  const nonAssetForm = useForm<RegisterNonAssetStockInput>({
    resolver: zodResolver(registerNonAssetStockSchema),
    defaultValues: {
      stockCode: "",
      itemName: "",
      itemType: "",
      categoryId: "",
      quantityOnHand: 1,
      unitOfMeasure: "EACH",
      purchaseOrderId: "",
      stockReceivedDate: new Date().toISOString().slice(0, 10),
      currentLocation: "",
      notes: "",
    },
  });
  const nonAssetPreview = nonAssetForm.watch();
  const nonAssetErrors = nonAssetForm.formState.errors;

  useUnsavedChangesWarning(
    (entryKind === "asset" && isDirty) || (entryKind === "non_asset" && nonAssetForm.formState.isDirty),
  );

  const nonAssetMutation = useMutation({
    mutationFn: registerNonAssetStockItem,
    onSuccess: (item) => {
      toast.success("Non-asset stock recorded");
      router.push(`/assets/non-asset/${item.stockItemId}`);
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Stock entry failed");
    },
  });

  if (!canManage) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader variant="standard" title="Register asset" description="Add a new asset to the register." />
        <Card className="p-6 text-sm text-muted-foreground">
          You need the assets.manage permission to register assets.{" "}
          <Link href="/assets" className="text-primary hover:underline">
            Back to list
          </Link>
        </Card>
      </div>
    );
  }

  const categoryName =
    categories.find((c) => c.categoryId === preview.categoryId)?.categoryName ?? "Category";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader variant="standard"
        title="Stock entry"
        description="Register serialized assets or quantity-based non-asset items."
        breadcrumbs={[{ label: "Assets", href: "/assets" }, { label: "New" }]}
        actions={
          <Button variant="outline" size="md" asChild>
            <Link href="/assets">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["asset", "Serialized asset"],
            ["non_asset", "Non-asset stock"],
          ] as const
        ).map(([kind, label]) => (
          <Button
            key={kind}
            type="button"
            size="sm"
            variant={entryKind === kind ? "default" : "outline"}
            className={cn(entryKind === kind && "bg-brand-gradient text-primary-foreground")}
            onClick={() => setEntryKind(kind)}
          >
            {label}
          </Button>
        ))}
      </div>

      {entryKind === "asset" ? (
      <CreateFormLayout
        aside={
          <>
            <CreateFormValidationCard requiredFields={["Asset code", "Asset name", "Category"]} />
            <CreateFormTips
              tips={[
                "Asset codes must be unique in the register.",
                "Link purchase order lines when receiving goods against a PO.",
              ]}
            />
            <CreateFormPreviewCard title="Register preview">
              <p className="font-medium truncate">{preview.assetName || "Asset name"}</p>
              <p className="text-xs text-muted-foreground truncate">
                {preview.assetCode || "Code"} · {categoryName}
              </p>
              {preview.currentLocation ? (
                <p className="text-xs text-muted-foreground truncate">{preview.currentLocation}</p>
              ) : null}
            </CreateFormPreviewCard>
          </>
        }
      >
        <form
          onSubmit={handleSubmit((values) => {
            const payload = { ...values };
            if (!canSeePurchaseCost) {
              delete payload.purchaseCost;
            }
            mutation.mutate(payload);
          })}
          className="flex flex-col gap-6"
          noValidate
        >
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-primary" />
                Asset information
              </CardTitle>
              <span className="text-xs font-medium text-destructive">* Required</span>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="assetCode" required>
                  Asset code
                </Label>
                <Input id="assetCode" error={!!errors.assetCode} {...register("assetCode")} />
                {errors.assetCode ? (
                  <p className="text-xs text-destructive">{errors.assetCode.message}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="categoryId" required>
                  Category
                </Label>
                <NativeSelect
                  id="categoryId"
                  error={!!errors.categoryId}
                  disabled={categoriesLoading}
                  {...register("categoryId")}
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {categories.map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>
                      {c.categoryName}
                    </option>
                  ))}
                </NativeSelect>
                {errors.categoryId ? (
                  <p className="text-xs text-destructive">{errors.categoryId.message}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="assetName" required>
                  Asset name
                </Label>
                <Input id="assetName" error={!!errors.assetName} {...register("assetName")} />
                {errors.assetName ? (
                  <p className="text-xs text-destructive">{errors.assetName.message}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="serialNumber">Serial number</Label>
                <Input id="serialNumber" {...register("serialNumber")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="currentLocation">Location</Label>
                <Input id="currentLocation" {...register("currentLocation")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="purchaseDate">Purchase date</Label>
                <Input id="purchaseDate" type="date" {...register("purchaseDate")} />
                {errors.purchaseDate ? (
                  <p className="text-xs text-destructive">{errors.purchaseDate.message}</p>
                ) : null}
              </div>
              {canSeePurchaseCost ? (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="purchaseCost">Purchase cost (optional)</Label>
                  <Input
                    id="purchaseCost"
                    type="number"
                    min={0}
                    step="0.01"
                    {...register("purchaseCost")}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>

          <CreateFormActions>
            <Button type="button" variant="outline" size="md" asChild>
              <Link href="/assets">Cancel</Link>
            </Button>
            <Button type="submit" size="md" loading={mutation.isPending}>
              Register asset
            </Button>
          </CreateFormActions>
        </form>
      </CreateFormLayout>
      ) : (
      <CreateFormLayout
        aside={
          <>
            <CreateFormValidationCard
              requiredFields={["Stock code", "Item name", "Category", "Quantity", "Unit"]}
            />
            <CreateFormTips
              tips={[
                "Non-asset items track quantity and commercial units (Each, Feet, Kg, …).",
                "Withdrawals and consumption are not automated — available qty equals on-hand qty.",
              ]}
            />
            <CreateFormPreviewCard title="Stock preview">
              <p className="font-medium truncate">{nonAssetPreview.itemName || "Item name"}</p>
              <p className="text-xs text-muted-foreground truncate">
                {nonAssetPreview.stockCode || "Code"} · {nonAssetPreview.quantityOnHand || "—"}{" "}
                {nonAssetPreview.unitOfMeasure || "unit"}
              </p>
            </CreateFormPreviewCard>
          </>
        }
      >
        <form
          onSubmit={nonAssetForm.handleSubmit((values) => nonAssetMutation.mutate(values))}
          className="flex flex-col gap-6"
          noValidate
        >
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-primary" />
                Non-asset stock
              </CardTitle>
              <span className="text-xs font-medium text-destructive">* Required</span>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="stockCode" required>
                  Stock code
                </Label>
                <Input id="stockCode" {...nonAssetForm.register("stockCode")} />
                {nonAssetErrors.stockCode ? (
                  <p className="text-xs text-destructive">{nonAssetErrors.stockCode.message}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="itemName" required>
                  Item name
                </Label>
                <Input id="itemName" {...nonAssetForm.register("itemName")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="itemType">Item type / classification</Label>
                <Input id="itemType" placeholder="e.g. Consumable, Cable" {...nonAssetForm.register("itemType")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="stockReceivedDate">Stock received date</Label>
                <Input id="stockReceivedDate" type="date" {...nonAssetForm.register("stockReceivedDate")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="na-categoryId" required>
                  Category
                </Label>
                <NativeSelect
                  id="na-categoryId"
                  {...nonAssetForm.register("categoryId")}
                  disabled={categoriesLoading}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>
                      {c.categoryName}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quantityOnHand" required>
                  Quantity
                </Label>
                <Input
                  id="quantityOnHand"
                  type="number"
                  step="any"
                  min={0}
                  {...nonAssetForm.register("quantityOnHand")}
                />
                {nonAssetErrors.quantityOnHand ? (
                  <p className="text-xs text-destructive">{nonAssetErrors.quantityOnHand.message}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="unitOfMeasure" required>
                  Unit of measure
                </Label>
                <NativeSelect id="unitOfMeasure" {...nonAssetForm.register("unitOfMeasure")}>
                  {UNITS_OF_MEASURE.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="purchaseOrderId">Purchase order (optional)</Label>
                <Controller
                  control={nonAssetForm.control}
                  name="purchaseOrderId"
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="None"
                      aria-label="Purchase order"
                      options={[
                        { value: "", label: "None" },
                        ...(poPage?.data ?? []).map((po) => ({
                          value: po.purchaseOrderId,
                          label: po.poNumber,
                          hint: po.vendor?.vendorName,
                        })),
                      ]}
                    />
                  )}
                />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="na-location">Location</Label>
                <Input id="na-location" {...nonAssetForm.register("currentLocation")} />
              </div>
            </CardContent>
          </Card>
          <CreateFormActions>
            <Button type="button" variant="outline" size="md" asChild>
              <Link href="/assets">Cancel</Link>
            </Button>
            <Button type="submit" size="md" loading={nonAssetMutation.isPending}>
              Save stock entry
            </Button>
          </CreateFormActions>
        </form>
      </CreateFormLayout>
      )}
    </div>
  );
}

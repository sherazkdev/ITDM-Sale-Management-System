"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { DetailField, DetailRecordLayout } from "@/components/crud/DetailRecordLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchNonAssetStockItem } from "@/lib/api/non-asset-stock";
import { ApiClientError } from "@/lib/api/client";

export default function NonAssetStockDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");

  const itemQuery = useQuery({
    queryKey: ["non-asset-stock", id],
    queryFn: () => fetchNonAssetStockItem(id),
  });

  const item = itemQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item?.itemName ?? "Non-asset stock"}
        description="Quantity-based inventory item."
        breadcrumbs={[
          { label: "Assets", href: "/assets?view=non-asset" },
          { label: item?.stockCode ?? id },
        ]}
        actions={
          <Button variant="outline" size="md" asChild>
            <Link href="/assets?view=non-asset">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      {itemQuery.isError ? (
        <Card className="p-4 text-sm text-destructive">
          {itemQuery.error instanceof ApiClientError
            ? itemQuery.error.message
            : "Failed to load stock item."}
        </Card>
      ) : null}

      {item ? (
        <DetailRecordLayout
          aside={
            <SectionCard title="Quantities">
              <dl className="flex flex-col gap-3">
                <DetailField
                  label="On hand"
                  value={`${item.quantityOnHand} ${item.unitOfMeasure}`}
                />
                <DetailField
                  label="Available"
                  value={`${item.quantityAvailable} ${item.unitOfMeasure}`}
                />
              </dl>
              {item.quantityAvailableNote ? (
                <p className="mt-3 text-xs text-muted-foreground">{item.quantityAvailableNote}</p>
              ) : null}
            </SectionCard>
          }
        >
          <SectionCard title="Item details">
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Stock code" value={item.stockCode} />
              <DetailField label="Item type" value={item.itemType ?? "—"} />
              <DetailField label="Category" value={item.category?.categoryName ?? "—"} />
              <DetailField label="Unit" value={item.unitOfMeasure} />
              <DetailField label="Received" value={item.stockReceivedDate?.slice(0, 10) ?? "—"} />
              <DetailField label="Location" value={item.currentLocation ?? "—"} />
              <DetailField
                label="Purchase order"
                value={
                  item.purchaseOrder ? (
                    <Link
                      href={`/purchase-orders/${item.purchaseOrder.purchaseOrderId}`}
                      className="text-primary hover:underline"
                    >
                      {item.purchaseOrder.poNumber}
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
              {item.notes ? <DetailField label="Notes" value={item.notes} /> : null}
            </dl>
          </SectionCard>
        </DetailRecordLayout>
      ) : null}
    </div>
  );
}

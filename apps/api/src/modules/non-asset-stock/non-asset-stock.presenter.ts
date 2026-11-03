import type { NonAssetStockItem, PurchaseOrder } from "@prisma/client";

type StockWithRelations = NonAssetStockItem & {
  category: { categoryId: bigint; categoryName: string };
  purchaseOrder?: Pick<PurchaseOrder, "purchaseOrderId" | "poNumber" | "poDate"> | null;
};

/** Available quantity = on hand until client approves withdrawal/consumption (D09). */
export function enrichNonAssetStockItem(item: StockWithRelations) {
  return {
    ...item,
    quantityAvailable: item.quantityOnHand,
    quantityAvailableNote:
      "Available equals quantity on hand — consumption and replenishment are not implemented.",
  };
}

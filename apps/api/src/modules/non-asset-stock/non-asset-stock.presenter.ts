import type {
  Employee,
  NonAssetStockItem,
  NonAssetStockMovement,
  PurchaseOrder,
  User,
} from "@prisma/client";
import type { MovementTotals } from "./non-asset-stock-movements.service.js";
import { decimalToNumber } from "./non-asset-stock-quantities.js";

type StockWithRelations = NonAssetStockItem & {
  category: { categoryId: bigint; categoryName: string };
  purchaseOrder?: Pick<PurchaseOrder, "purchaseOrderId" | "poNumber" | "poDate"> | null;
};

type MovementWithRelations = NonAssetStockMovement & {
  employee?: Pick<Employee, "employeeId" | "employeeNumber" | "fullName" | "department"> | null;
  performedByUser?: Pick<User, "userId" | "displayName"> | null;
};

export function enrichNonAssetStockItem(item: StockWithRelations, totals?: MovementTotals) {
  return {
    ...item,
    quantityOnHand: decimalToNumber(item.quantityOnHand),
    quantityAvailable: decimalToNumber(item.quantityAvailable),
    quantityTotalReceived: decimalToNumber(item.quantityOnHand),
    quantityIssued: totals?.quantityIssued ?? 0,
    quantityReturned: totals?.quantityReturned ?? 0,
    quantityReplenished: totals?.quantityReplenished ?? 0,
    quantityWrittenOff: totals?.quantityWrittenOff ?? 0,
    quantityIssuedOutstanding: totals?.quantityIssuedOutstanding ?? 0,
    quantityAvailableNote: null as string | null,
  };
}

export function enrichNonAssetStockMovement(movement: MovementWithRelations) {
  return {
    ...movement,
    quantity: decimalToNumber(movement.quantity),
    quantityBefore: movement.quantityBefore != null ? decimalToNumber(movement.quantityBefore) : null,
    quantityAfter: movement.quantityAfter != null ? decimalToNumber(movement.quantityAfter) : null,
  };
}

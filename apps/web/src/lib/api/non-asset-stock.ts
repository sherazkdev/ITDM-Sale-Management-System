import { apiGet, apiGetPage, apiPatch, apiPost } from "./client";
import { toQueryString } from "./query-string";

export type NonAssetStockItem = {
  stockItemId: string;
  stockCode: string;
  itemName: string;
  itemType: string | null;
  categoryId: string;
  quantityOnHand: number | string;
  quantityAvailable: number | string;
  quantityTotalReceived?: number;
  quantityIssued?: number;
  quantityReturned?: number;
  quantityReplenished?: number;
  quantityWrittenOff?: number;
  quantityIssuedOutstanding?: number;
  quantityAvailableNote?: string | null;
  unitOfMeasure: string;
  stockReceivedDate: string;
  purchaseOrderId: string | null;
  currentLocation: string | null;
  notes: string | null;
  category?: { categoryId: string; categoryName: string };
  purchaseOrder?: { purchaseOrderId: string; poNumber: string; poDate: string } | null;
};

export async function fetchNonAssetStockItems(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  unitOfMeasure?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}) {
  return apiGetPage<NonAssetStockItem>(
    `/non-asset-stock-items${toQueryString({
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
      search: params?.search,
      categoryId: params?.categoryId,
      unitOfMeasure: params?.unitOfMeasure,
      sortBy: params?.sortBy,
      sortDir: params?.sortDir,
    })}`,
  );
}

export async function fetchNonAssetStockItem(id: string) {
  return apiGet<NonAssetStockItem>(`/non-asset-stock-items/${id}`);
}

export async function registerNonAssetStockItem(input: {
  stockCode: string;
  itemName: string;
  itemType?: string;
  categoryId: string;
  quantityOnHand: number;
  unitOfMeasure: string;
  purchaseOrderId?: string;
  stockReceivedDate?: string;
  currentLocation?: string;
  notes?: string;
}) {
  const body: Record<string, unknown> = {
    stockCode: input.stockCode.trim(),
    itemName: input.itemName.trim(),
    categoryId: input.categoryId,
    quantityOnHand: input.quantityOnHand,
    unitOfMeasure: input.unitOfMeasure,
  };
  if (input.itemType?.trim()) body.itemType = input.itemType.trim();
  if (input.purchaseOrderId?.trim()) body.purchaseOrderId = input.purchaseOrderId.trim();
  if (input.stockReceivedDate?.trim()) body.stockReceivedDate = input.stockReceivedDate.trim();
  if (input.currentLocation?.trim()) body.currentLocation = input.currentLocation.trim();
  if (input.notes?.trim()) body.notes = input.notes.trim();
  return apiPost<NonAssetStockItem>("/non-asset-stock-items", body);
}

export async function updateNonAssetStockItem(
  id: string,
  input: { itemName?: string; itemType?: string | null; currentLocation?: string; notes?: string },
) {
  return apiPatch<NonAssetStockItem>(`/non-asset-stock-items/${id}`, input);
}

export type NonAssetStockMovement = {
  movementId: string;
  stockItemId: string;
  movementType: string;
  quantity: number;
  quantityBefore: number | null;
  quantityAfter: number | null;
  employeeId: string | null;
  department: string | null;
  referenceReason: string | null;
  idempotencyKey: string | null;
  createdAt: string;
  employee?: { employeeId: string; employeeNumber: string; fullName: string; department: string | null };
};

type MovementPayload = {
  quantity: number;
  employeeId?: string;
  department?: string;
  referenceReason?: string;
  idempotencyKey?: string;
};

export async function fetchNonAssetStockMovements(stockItemId: string, page = 1, pageSize = 50) {
  return apiGetPage<NonAssetStockMovement>(
    `/non-asset-stock-items/${stockItemId}/movements${toQueryString({ page, pageSize })}`,
  );
}

async function postMovement(stockItemId: string, path: string, body: MovementPayload) {
  return apiPost<{ movement: NonAssetStockMovement; item: NonAssetStockItem }>(
    `/non-asset-stock-items/${stockItemId}/movements/${path}`,
    body,
  );
}

export const issueNonAssetStock = (id: string, body: MovementPayload) => postMovement(id, "issue", body);
export const returnNonAssetStock = (id: string, body: MovementPayload) => postMovement(id, "return", body);
export const replenishNonAssetStock = (id: string, body: Omit<MovementPayload, "employeeId" | "department">) =>
  postMovement(id, "replenish", body);
export const writeOffNonAssetStock = (id: string, body: Omit<MovementPayload, "employeeId" | "department">) =>
  postMovement(id, "write-off", body);

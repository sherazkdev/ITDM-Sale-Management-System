import { apiGet, apiGetPage, apiPatch, apiPost } from "./client";

export type NonAssetStockItem = {
  stockItemId: string;
  stockCode: string;
  itemName: string;
  itemType: string | null;
  categoryId: string;
  quantityOnHand: string;
  quantityAvailable: string;
  quantityAvailableNote?: string;
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
}) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params?.search) qs.set("search", params.search);
  if (params?.categoryId) qs.set("categoryId", params.categoryId);
  if (params?.unitOfMeasure) qs.set("unitOfMeasure", params.unitOfMeasure);
  const q = qs.toString();
  return apiGetPage<NonAssetStockItem>(`/non-asset-stock-items${q ? `?${q}` : ""}`);
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

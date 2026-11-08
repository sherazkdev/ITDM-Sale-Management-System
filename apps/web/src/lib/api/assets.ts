import { apiGet, apiGetPage, apiPatch, apiPost } from "./client";
import { toQueryString } from "./query-string";
import type { RegisterAssetInput, UpdateAssetMetadataInput } from "@/lib/validators/asset";

export type Asset = {
  assetId: string;
  assetCode: string;
  assetName: string;
  assetStatus: string;
  categoryId: string;
  serialNumber: string | null;
  purchaseOrderId: string | null;
  purchaseDate: string | null;
  purchaseCost?: string | null;
  currentLocation: string | null;
  currentAssigneeEmployeeId: string | null;
  category?: { categoryId: string; categoryName: string };
};

export type AssetHistoryRow = {
  transactionId: string;
  transactionType: string;
  transactionDate: string;
  receivingDepartment?: string | null;
  employee?: { employeeId: string; fullName: string; employeeNumber: string } | null;
  movementDocument?: { documentId: string; documentNumber: string } | null;
};

export type AssetHolder = {
  employeeId: string;
  fullName: string;
  employeeNumber: string;
} | null;

export type AssetListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  categoryId?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

function cleanRegisterBody(input: RegisterAssetInput) {
  const body: Record<string, unknown> = {
    assetCode: input.assetCode.trim(),
    assetName: input.assetName.trim(),
    categoryId: input.categoryId,
  };
  if (input.serialNumber) body.serialNumber = input.serialNumber;
  if (input.purchaseOrderId) body.purchaseOrderId = input.purchaseOrderId;
  if (input.purchaseOrderLineId) body.purchaseOrderLineId = input.purchaseOrderLineId;
  if (input.purchaseDate) body.purchaseDate = input.purchaseDate;
  if (input.purchaseCost !== undefined) body.purchaseCost = input.purchaseCost;
  if (input.currentLocation) body.currentLocation = input.currentLocation;
  return body;
}

export function fetchAssets(params: AssetListParams) {
  return apiGetPage<Asset>(
    `/assets${toQueryString({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      search: params.search,
      status: params.status,
      categoryId: params.categoryId,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
    })}`,
  );
}

export function fetchAsset(id: string) {
  return apiGet<Asset>(`/assets/${id}`);
}

export function fetchAssetHistory(id: string) {
  return apiGet<AssetHistoryRow[]>(`/assets/${id}/history`);
}

export function fetchAssetCurrentHolder(id: string) {
  return apiGet<AssetHolder>(`/assets/${id}/current-holder`);
}

export function registerAsset(input: RegisterAssetInput) {
  return apiPost<Asset>("/assets", cleanRegisterBody(input));
}

export function updateAssetMetadata(id: string, input: UpdateAssetMetadataInput) {
  const body: Record<string, unknown> = {};
  if (input.assetName) body.assetName = input.assetName;
  if (input.serialNumber !== undefined) body.serialNumber = input.serialNumber || null;
  if (input.currentLocation !== undefined) body.currentLocation = input.currentLocation || null;
  return apiPatch<Asset>(`/assets/${id}`, body);
}

export function retireAsset(id: string) {
  return apiPost<Asset>(`/assets/${id}/retire`);
}

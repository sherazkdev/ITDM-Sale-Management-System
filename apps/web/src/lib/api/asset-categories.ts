import { apiGet, apiPatch, apiPost } from "./client";
import type { CreateAssetCategoryInput } from "@/lib/validators/asset";

export type AssetCategory = {
  categoryId: string;
  categoryName: string;
  description: string | null;
};

export function fetchAssetCategories() {
  return apiGet<AssetCategory[]>("/asset-categories");
}

export function createAssetCategory(input: CreateAssetCategoryInput) {
  const body: Record<string, unknown> = { categoryName: input.categoryName.trim() };
  if (input.description) body.description = input.description;
  return apiPost<AssetCategory>("/asset-categories", body);
}

export function updateAssetCategory(id: string, input: Partial<CreateAssetCategoryInput>) {
  const body: Record<string, unknown> = {};
  if (input.categoryName) body.categoryName = input.categoryName.trim();
  if (input.description !== undefined) body.description = input.description || null;
  return apiPatch<AssetCategory>(`/asset-categories/${id}`, body);
}

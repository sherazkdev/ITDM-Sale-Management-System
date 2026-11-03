import { z } from "zod";

export const createAssetCategorySchema = z.object({
  categoryName: z.string().min(1).max(128),
  description: z.string().max(4000).optional(),
});

export const updateAssetCategorySchema = createAssetCategorySchema.partial();

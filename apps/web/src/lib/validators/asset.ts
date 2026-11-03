import { z } from "zod";

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .optional()
  .or(z.literal(""));

export const registerAssetSchema = z.object({
  assetCode: z.string().min(1, "Asset code is required").max(64),
  assetName: z.string().min(1, "Asset name is required").max(255),
  categoryId: z.string().min(1, "Category is required"),
  serialNumber: z.string().max(128).optional().or(z.literal("")),
  purchaseOrderId: z.string().optional().or(z.literal("")),
  purchaseOrderLineId: z.string().optional().or(z.literal("")),
  purchaseDate: dateOnly,
  purchaseCost: z.coerce.number().nonnegative().optional().or(z.nan()).transform((v) => (Number.isNaN(v) ? undefined : v)),
  currentLocation: z.string().max(255).optional().or(z.literal("")),
});

export const updateAssetMetadataSchema = z
  .object({
    assetName: z.string().min(1).max(255).optional(),
    serialNumber: z.string().max(128).optional().or(z.literal("")),
    currentLocation: z.string().max(255).optional().or(z.literal("")),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined && x !== ""), {
    message: "Change at least one field",
  });

export const createAssetCategorySchema = z.object({
  categoryName: z.string().min(1).max(128),
  description: z.string().max(4000).optional().or(z.literal("")),
});

export type RegisterAssetInput = z.infer<typeof registerAssetSchema>;
export type UpdateAssetMetadataInput = z.infer<typeof updateAssetMetadataSchema>;
export type CreateAssetCategoryInput = z.infer<typeof createAssetCategorySchema>;

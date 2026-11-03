import { z } from "zod";

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .optional();

export const registerAssetSchema = z.object({
  assetCode: z.string().min(1).max(64),
  assetName: z.string().min(1).max(255),
  categoryId: z.coerce.bigint(),
  serialNumber: z.string().max(128).optional(),
  purchaseOrderId: z.coerce.bigint().optional(),
  purchaseOrderLineId: z.coerce.bigint().optional(),
  purchaseDate: dateOnly,
  purchaseCost: z.coerce.number().nonnegative().optional(),
  currentLocation: z.string().max(255).optional(),
});

export const updateAssetMetadataSchema = z
  .object({
    assetName: z.string().min(1).max(255).optional(),
    serialNumber: z.string().max(128).optional(),
    currentLocation: z.string().max(255).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

import { z } from "zod";

export const UNITS_OF_MEASURE = [
  "EACH",
  "FEET",
  "KILOGRAM",
  "METER",
  "LITER",
  "BOX",
  "PACK",
  "OTHER",
] as const;

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").or(z.literal(""));

export const registerNonAssetStockSchema = z.object({
  stockCode: z.string().min(1, "Stock code is required").max(64),
  itemName: z.string().min(1, "Item name is required").max(255),
  itemType: z.string().max(64).optional().or(z.literal("")),
  categoryId: z.string().min(1, "Category is required"),
  quantityOnHand: z.coerce.number().positive("Quantity must be greater than zero"),
  unitOfMeasure: z.enum(UNITS_OF_MEASURE),
  purchaseOrderId: z.string().optional().or(z.literal("")),
  stockReceivedDate: dateOnly.optional(),
  currentLocation: z.string().max(255).optional(),
  notes: z.string().max(4000).optional(),
});

export type RegisterNonAssetStockInput = z.infer<typeof registerNonAssetStockSchema>;

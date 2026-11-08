import { z } from "zod";
import { UNITS_OF_MEASURE } from "../../shared/domain/inventory-units.js";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const createNonAssetStockItemSchema = z.object({
  stockCode: z.string().min(1).max(64),
  itemName: z.string().min(1).max(255),
  itemType: z.string().max(64).optional(),
  categoryId: z.string().regex(/^\d+$/),
  quantityOnHand: z.coerce.number().positive("Quantity must be greater than zero"),
  unitOfMeasure: z.enum(UNITS_OF_MEASURE as unknown as [string, ...string[]]),
  purchaseOrderId: z.string().regex(/^\d+$/).optional(),
  stockReceivedDate: dateOnly.optional(),
  currentLocation: z.string().max(255).optional(),
  notes: z.string().max(4000).optional(),
});

export const updateNonAssetStockItemSchema = z.object({
  itemName: z.string().min(1).max(255).optional(),
  itemType: z.string().max(64).optional().nullable(),
  currentLocation: z.string().max(255).optional(),
  notes: z.string().max(4000).optional(),
});

const positiveQty = z.coerce.number().positive("Quantity must be greater than zero");

export const nonAssetStockMovementBodySchema = z.object({
  quantity: positiveQty,
  employeeId: z.string().regex(/^\d+$/).optional(),
  department: z.string().min(1).max(128).optional(),
  referenceReason: z.string().max(255).optional(),
  idempotencyKey: z.string().min(1).max(128).optional(),
});

export const nonAssetStockQuantityBodySchema = z.object({
  quantity: positiveQty,
  referenceReason: z.string().max(255).optional(),
  idempotencyKey: z.string().min(1).max(128).optional(),
});

export const listNonAssetStockMovementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  employeeId: z.string().regex(/^\d+$/).optional(),
});

export const listNonAssetStockQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(128).optional(),
  categoryId: z.string().regex(/^\d+$/).optional(),
  unitOfMeasure: z.string().max(32).optional(),
  sortBy: z.string().max(64).optional(),
  sortDir: z.enum(["asc", "desc"]).optional().default("asc"),
});

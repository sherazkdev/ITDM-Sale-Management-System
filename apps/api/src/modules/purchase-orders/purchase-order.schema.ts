import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createPurchaseOrderSchema = z.object({
  poNumber: z.string().min(1).max(64),
  vendorId: z.coerce.bigint(),
  contractId: z.coerce.bigint().optional(),
  poDate: dateOnly,
  currency: z.string().length(3),
  validUntil: dateOnly.optional(),
});

export const updatePurchaseOrderSchema = z.object({
  poDate: dateOnly.optional(),
  currency: z.string().length(3).optional(),
  contractId: z.coerce.bigint().nullable().optional(),
  validUntil: dateOnly.nullable().optional(),
});

export const purchaseOrderLineSchema = z.object({
  lineNumber: z.number().int().positive(),
  description: z.string().min(1).max(512),
  lineType: z.string().min(1).max(32),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
});

export const updatePurchaseOrderLineSchema = purchaseOrderLineSchema.partial().omit({ lineNumber: true });

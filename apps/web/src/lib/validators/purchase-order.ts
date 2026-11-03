import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const createPurchaseOrderSchema = z.object({
  poNumber: z.string().min(1, "PO number is required").max(64),
  vendorId: z.string().min(1, "Vendor is required"),
  contractId: z.string().optional().or(z.literal("")),
  poDate: dateOnly,
  currency: z.string().length(3, "Use 3-letter currency code"),
  validUntil: dateOnly.optional().or(z.literal("")),
});

export const updatePurchaseOrderSchema = z.object({
  poDate: dateOnly.optional(),
  currency: z.string().length(3).optional(),
  contractId: z.string().nullable().optional(),
  validUntil: dateOnly.nullable().optional().or(z.literal("")),
});

export const purchaseOrderLineSchema = z.object({
  lineNumber: z.coerce.number().int().positive(),
  description: z.string().min(1).max(512),
  lineType: z.string().min(1).max(32),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export type PurchaseOrderLineInput = z.infer<typeof purchaseOrderLineSchema>;

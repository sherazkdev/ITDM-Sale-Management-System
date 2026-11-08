import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const correctionReasonSchema = z
  .string()
  .trim()
  .min(3, "Correction reason is required")
  .max(2000, "Reason is too long");

export const correctDraftInvoiceSchema = z
  .object({
    correctionReason: correctionReasonSchema,
    invoiceNumber: z.string().min(1).max(64).optional(),
    invoiceDate: dateOnly.optional(),
    invoiceAmount: z.coerce.number().positive().optional(),
  })
  .refine((v) => v.invoiceNumber || v.invoiceDate || v.invoiceAmount !== undefined, {
    message: "Provide at least one field to correct",
  });

export const correctBudgetAllocationSchema = z
  .object({
    correctionReason: correctionReasonSchema,
    budgetCategory: z.string().min(1).max(128).optional(),
    allocatedAmount: z.coerce.number().positive().optional(),
  })
  .refine((v) => v.budgetCategory || v.allocatedAmount !== undefined, {
    message: "Provide at least one field to correct",
  });

import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required").max(64),
  purchaseOrderId: z.string().min(1, "Purchase order is required"),
  invoiceDate: dateOnly,
  invoiceAmount: z.coerce.number().positive("Amount must be positive"),
});

export const recordPaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  paidAt: z.string().optional().or(z.literal("")),
  referenceNumber: z.string().max(64).optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
  exchangeRateToUsd: z.coerce.number().positive().optional(),
});

export const postInvoiceSchema = z.object({
  budgetId: z.string().min(1, "Budget allocation is required"),
  commitmentExchangeRateToUsd: z.coerce.number().positive().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type PostInvoiceInput = z.infer<typeof postInvoiceSchema>;

export const correctDraftInvoiceSchema = z
  .object({
    correctionReason: z.string().trim().min(3, "Correction reason is required").max(2000),
    invoiceNumber: z.string().min(1).max(64).optional().or(z.literal("")),
    invoiceDate: dateOnly.optional().or(z.literal("")),
    invoiceAmount: z.coerce.number().positive().optional(),
  })
  .refine(
    (v) =>
      Boolean(v.invoiceNumber?.trim()) ||
      Boolean(v.invoiceDate?.trim()) ||
      v.invoiceAmount !== undefined,
    { message: "Provide at least one field to correct" },
  );

export type CorrectDraftInvoiceInput = z.infer<typeof correctDraftInvoiceSchema>;

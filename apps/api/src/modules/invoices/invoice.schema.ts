import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1).max(64),
  purchaseOrderId: z.coerce.bigint(),
  invoiceDate: dateOnly,
  invoiceAmount: z.coerce.number().positive(),
});

export const postInvoiceSchema = z.object({
  budgetId: z.coerce.bigint(),
  commitmentExchangeRateToUsd: z.coerce.number().positive().optional(),
});

export const recordPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  paidAt: z.string().datetime().optional(),
  referenceNumber: z.string().max(64).optional(),
  idempotencyKey: z.string().min(1).max(128),
  notes: z.string().max(4000).optional(),
  exchangeRateToUsd: z.coerce.number().positive().optional(),
  budgetId: z.coerce.bigint().optional(),
});

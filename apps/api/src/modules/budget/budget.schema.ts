import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createFinancialYearSchema = z.object({
  yearName: z.string().min(1).max(32),
  startDate: dateOnly,
  endDate: dateOnly,
  status: z.string().min(1).max(64),
});

export const createBudgetAllocationSchema = z.object({
  financialYearId: z.coerce.bigint(),
  budgetCategory: z.string().min(1).max(128),
  allocatedAmount: z.coerce.number().positive(),
  currency: z.string().length(3),
});

export const appendLedgerEntrySchema = z.object({
  budgetId: z.coerce.bigint(),
  transactionType: z.string().min(1).max(64),
  amount: z.coerce.number().positive(),
  transactionDate: dateOnly,
  purchaseOrderId: z.coerce.bigint().optional(),
  invoiceId: z.coerce.bigint().optional(),
  remarks: z.string().max(4000).optional(),
});

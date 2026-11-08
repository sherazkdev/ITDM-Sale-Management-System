import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const createFinancialYearSchema = z.object({
  yearName: z.string().min(1, "Year name is required").max(32),
  startDate: dateOnly,
  endDate: dateOnly,
  status: z.string().min(1, "Status is required").max(64),
});

export const createBudgetAllocationSchema = z.object({
  financialYearId: z.string().min(1, "Financial year is required"),
  budgetCategory: z.string().min(1, "Category is required").max(128),
  allocatedAmount: z.coerce.number().positive("Allocated amount must be positive"),
  currency: z.string().length(3, "Use a 3-letter currency code"),
});

export const appendLedgerEntrySchema = z.object({
  correctionReason: z.string().trim().min(3, "Correction reason is required").max(2000),
  budgetId: z.string().min(1, "Budget allocation is required"),
  transactionType: z.string().min(1, "Transaction type is required").max(64),
  amount: z.coerce.number().positive("Amount must be positive"),
  transactionDate: dateOnly,
  purchaseOrderId: z.string().optional().or(z.literal("")),
  invoiceId: z.string().optional().or(z.literal("")),
  remarks: z.string().max(4000).optional().or(z.literal("")),
});

export type CreateFinancialYearInput = z.infer<typeof createFinancialYearSchema>;
export type CreateBudgetAllocationInput = z.infer<typeof createBudgetAllocationSchema>;
export type AppendLedgerEntryInput = z.infer<typeof appendLedgerEntrySchema>;

export const correctBudgetAllocationSchema = z
  .object({
    correctionReason: z.string().trim().min(3, "Correction reason is required").max(2000),
    budgetCategory: z.string().min(1).max(128).optional().or(z.literal("")),
    allocatedAmount: z.coerce.number().positive().optional(),
  })
  .refine((v) => (v.budgetCategory?.trim() ? true : v.allocatedAmount !== undefined), {
    message: "Provide category and/or allocated amount",
  });

export type CorrectBudgetAllocationInput = z.infer<typeof correctBudgetAllocationSchema>;

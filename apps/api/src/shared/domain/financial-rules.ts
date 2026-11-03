/** Client Wave 2 — main budget reporting currency (D08). */
export const REPORTING_CURRENCY = "USD";

export const BudgetTransactionType = {
  manual: "MANUAL",
  committedInvoice: "COMMITTED_INVOICE",
  actualPayment: "ACTUAL_PAYMENT",
} as const;

export type BudgetTransactionTypeValue =
  (typeof BudgetTransactionType)[keyof typeof BudgetTransactionType];

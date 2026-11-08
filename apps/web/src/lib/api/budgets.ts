import { apiGet, apiPatch, apiPost } from "./client";
import { toQueryString } from "./query-string";
import type {
  AppendLedgerEntryInput,
  CorrectBudgetAllocationInput,
  CreateBudgetAllocationInput,
  CreateFinancialYearInput,
} from "@/lib/validators/budget";

export type FinancialYear = {
  financialYearId: string;
  yearName: string;
  startDate: string;
  endDate: string;
  status: string;
};

export type BudgetAllocation = {
  budgetId: string;
  financialYearId: string;
  budgetCategory: string;
  allocatedAmount: string;
  currency: string;
};

export type BudgetTransaction = {
  budgetTransactionId: string;
  budgetId: string;
  transactionType: string;
  amount: string;
  transactionDate: string;
  purchaseOrderId: string | null;
  invoiceId: string | null;
  remarks: string | null;
};

export type BudgetSummary = {
  budgetId: string;
  budgetCategory: string;
  currency: string;
  reportingCurrency: string;
  allocatedAmount: string;
  allocatedUsdReporting: string | null;
  utilizedUsd: string;
  committedUsd: string;
  committedUsdProvisional: boolean;
  actualPaidUsd: string;
  actualUsdProvisional?: boolean;
  remainingUsd: string | null;
  utilizationPercent: string | null;
  manualLedgerTotal: string;
  provisionalNote: string | null;
  semanticsNote: string;
  financialYear: FinancialYear;
  transactions: BudgetTransaction[];
  /** @deprecated use remainingUsd */
  ledgerTotal?: string;
  remainingProvisional?: string;
};

export type BudgetByPo = {
  purchaseOrderId: string;
  transactions: BudgetTransaction[];
  semanticsNote: string;
};

export type BudgetByVendor = {
  vendorId: string;
  transactions: (BudgetTransaction & {
    purchaseOrder?: { purchaseOrderId: string; poNumber: string };
  })[];
  semanticsNote: string;
};

export function fetchFinancialYears() {
  return apiGet<FinancialYear[]>("/financial-years");
}

export function createFinancialYear(input: CreateFinancialYearInput) {
  return apiPost<FinancialYear>("/financial-years", {
    yearName: input.yearName.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status.trim(),
  });
}

export function fetchBudgetAllocations(financialYearId?: string) {
  return apiGet<BudgetAllocation[]>(
    `/budget-allocations${toQueryString({
      financialYearId: financialYearId || undefined,
    })}`,
  );
}

export function createBudgetAllocation(input: CreateBudgetAllocationInput) {
  return apiPost<BudgetAllocation>("/budget-allocations", {
    financialYearId: input.financialYearId,
    budgetCategory: input.budgetCategory.trim(),
    allocatedAmount: input.allocatedAmount,
    currency: input.currency.toUpperCase(),
  });
}

export function appendBudgetLedgerEntry(input: AppendLedgerEntryInput) {
  const body: Record<string, unknown> = {
    correctionReason: input.correctionReason.trim(),
    budgetId: input.budgetId,
    transactionType: input.transactionType.trim(),
    amount: input.amount,
    transactionDate: input.transactionDate,
  };
  if (input.purchaseOrderId?.trim()) body.purchaseOrderId = input.purchaseOrderId.trim();
  if (input.invoiceId?.trim()) body.invoiceId = input.invoiceId.trim();
  if (input.remarks?.trim()) body.remarks = input.remarks.trim();
  return apiPost<BudgetTransaction>("/budget-ledger/entries", body);
}

export function correctBudgetAllocation(budgetId: string, input: CorrectBudgetAllocationInput) {
  const body: Record<string, unknown> = {
    correctionReason: input.correctionReason.trim(),
  };
  if (input.budgetCategory?.trim()) body.budgetCategory = input.budgetCategory.trim();
  if (input.allocatedAmount !== undefined) body.allocatedAmount = input.allocatedAmount;
  return apiPatch<BudgetAllocation>(`/budget-allocations/${budgetId}/corrections`, body);
}

export function fetchBudgetSummary(budgetId: string) {
  return apiGet<BudgetSummary>(`/budgets/${budgetId}/summary`);
}

export function fetchBudgetByPurchaseOrder(purchaseOrderId: string) {
  return apiGet<BudgetByPo>(`/budgets/by-po/${purchaseOrderId}`);
}

export function fetchBudgetByVendor(vendorId: string) {
  return apiGet<BudgetByVendor>(`/budgets/by-vendor/${vendorId}`);
}

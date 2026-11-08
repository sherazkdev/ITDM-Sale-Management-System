import { apiGet, apiGetPage, apiPatch, apiPost } from "./client";
import { toQueryString } from "./query-string";
import type {
  CorrectDraftInvoiceInput,
  CreateInvoiceInput,
  RecordPaymentInput,
} from "@/lib/validators/invoice";

export type Invoice = {
  invoiceId: string;
  invoiceNumber: string;
  purchaseOrderId: string;
  invoiceDate: string;
  invoiceAmount: string;
  currency: string;
  paymentStatus: string;
  paymentDate: string | null;
  postedAt: string | null;
  commitmentAmountUsd: string | null;
  purchaseOrder?: {
    purchaseOrderId: string;
    poNumber: string;
    vendorId: string;
    currency: string;
    vendor?: { vendorId: string; vendorName: string };
  };
  payments?: InvoicePayment[];
};

export type InvoiceBalance = {
  invoiceId: string;
  currency: string;
  reportingCurrency: string;
  invoiceAmount: string;
  paidTotal: string;
  paidTotalUsd: string;
  outstanding: string;
  paymentStatus: string;
  postedAt: string | null;
  commitmentAmountUsd: string | null;
};

export type InvoicePayment = {
  invoicePaymentId: string;
  invoiceId: string;
  amount: string;
  currency: string;
  exchangeRateToUsd: string;
  amountUsd: string;
  paidAt: string;
  referenceNumber: string | null;
  idempotencyKey: string;
  notes: string | null;
};

export type InvoiceListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  paymentStatus?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

export function fetchInvoices(params: InvoiceListParams) {
  return apiGetPage<Invoice>(
    `/invoices${toQueryString({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      search: params.search,
      paymentStatus: params.paymentStatus,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
    })}`,
  );
}

export function fetchInvoice(id: string) {
  return apiGet<Invoice>(`/invoices/${id}`);
}

export function fetchInvoiceBalance(id: string) {
  return apiGet<InvoiceBalance>(`/invoices/${id}/balance`);
}

export function fetchInvoicePayments(id: string) {
  return apiGet<InvoicePayment[]>(`/invoices/${id}/payments`);
}

export function createInvoice(input: CreateInvoiceInput) {
  return apiPost<Invoice>("/invoices", {
    invoiceNumber: input.invoiceNumber.trim(),
    purchaseOrderId: input.purchaseOrderId,
    invoiceDate: input.invoiceDate,
    invoiceAmount: input.invoiceAmount,
  });
}

export function postInvoice(
  invoiceId: string,
  input: { budgetId: string; commitmentExchangeRateToUsd?: number },
) {
  return apiPost<Invoice>(`/invoices/${invoiceId}/post`, {
    budgetId: input.budgetId,
    ...(input.commitmentExchangeRateToUsd !== undefined
      ? { commitmentExchangeRateToUsd: input.commitmentExchangeRateToUsd }
      : {}),
  });
}

export function correctDraftInvoice(invoiceId: string, input: CorrectDraftInvoiceInput) {
  const body: Record<string, unknown> = {
    correctionReason: input.correctionReason.trim(),
  };
  if (input.invoiceNumber?.trim()) body.invoiceNumber = input.invoiceNumber.trim();
  if (input.invoiceDate?.trim()) body.invoiceDate = input.invoiceDate.trim();
  if (input.invoiceAmount !== undefined) body.invoiceAmount = input.invoiceAmount;
  return apiPatch<Invoice>(`/invoices/${invoiceId}/corrections`, body);
}

export function recordInvoicePayment(invoiceId: string, input: RecordPaymentInput, idempotencyKey: string) {
  const body: Record<string, unknown> = {
    amount: input.amount,
    idempotencyKey,
  };
  if (input.paidAt?.trim()) body.paidAt = new Date(input.paidAt).toISOString();
  if (input.referenceNumber?.trim()) body.referenceNumber = input.referenceNumber.trim();
  if (input.notes?.trim()) body.notes = input.notes.trim();
  if (input.exchangeRateToUsd !== undefined) body.exchangeRateToUsd = input.exchangeRateToUsd;
  return apiPost<InvoiceBalance>(`/invoices/${invoiceId}/payments`, body);
}

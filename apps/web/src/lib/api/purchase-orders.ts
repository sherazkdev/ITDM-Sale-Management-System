import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from "./client";
import { toQueryString } from "./query-string";
import type {
  CreatePurchaseOrderInput,
  PurchaseOrderLineInput,
  UpdatePurchaseOrderInput,
} from "@/lib/validators/purchase-order";

export type PurchaseOrderLine = {
  purchaseOrderLineId: string;
  lineNumber: number;
  description: string;
  lineType: string;
  quantity: string;
  unitPrice: string;
  lineSubtotal: string;
};

export type PurchaseOrder = {
  purchaseOrderId: string;
  poNumber: string;
  vendorId: string;
  contractId: string | null;
  poDate: string;
  totalAmount: string;
  currency: string;
  status: string;
  validUntil: string | null;
  documentPath: string | null;
  lines?: PurchaseOrderLine[];
  vendor?: { vendorId: string; vendorName: string };
  contract?: { contractId: string; contractNumber: string } | null;
};

export type PoListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  vendorId?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

export type InvoiceSummary = {
  invoiceId: string;
  invoiceNumber: string;
  invoiceAmount: string;
  paymentStatus: string;
};

function cleanCreateBody(input: CreatePurchaseOrderInput) {
  const body: Record<string, unknown> = {
    poNumber: input.poNumber.trim(),
    vendorId: input.vendorId,
    poDate: input.poDate,
    currency: input.currency.toUpperCase(),
  };
  if (input.contractId) body.contractId = input.contractId;
  if (input.validUntil) body.validUntil = input.validUntil;
  return body;
}

export function fetchPurchaseOrders(params: PoListParams) {
  return apiGetPage<PurchaseOrder>(
    `/purchase-orders${toQueryString({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      search: params.search,
      status: params.status,
      vendorId: params.vendorId,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
    })}`,
  );
}

export function fetchPurchaseOrder(id: string) {
  return apiGet<PurchaseOrder>(`/purchase-orders/${id}`);
}

export function fetchPurchaseOrderInvoices(id: string) {
  return apiGet<InvoiceSummary[]>(`/purchase-orders/${id}/invoices`);
}

export function createPurchaseOrderDraft(input: CreatePurchaseOrderInput) {
  return apiPost<PurchaseOrder>("/purchase-orders", cleanCreateBody(input));
}

export function updatePurchaseOrderDraft(id: string, input: UpdatePurchaseOrderInput) {
  return apiPatch<PurchaseOrder>(`/purchase-orders/${id}`, input);
}

export function addPurchaseOrderLine(id: string, line: PurchaseOrderLineInput) {
  return apiPost<PurchaseOrder>(`/purchase-orders/${id}/lines`, line);
}

export function removePurchaseOrderLine(poId: string, lineId: string) {
  return apiDelete<PurchaseOrder>(`/purchase-orders/${poId}/lines/${lineId}`);
}

export function submitPurchaseOrder(id: string) {
  return apiPost<unknown>(`/purchase-orders/${id}/submit`);
}

export function approvePurchaseOrder(id: string) {
  return apiPost<unknown>(`/purchase-orders/${id}/approve`);
}

export function cancelPurchaseOrder(id: string) {
  return apiPost<unknown>(`/purchase-orders/${id}/cancel`);
}

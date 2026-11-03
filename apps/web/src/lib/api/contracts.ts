import { apiGet, apiGetPage, apiPatch, apiPost } from "./client";
import { toQueryString } from "./query-string";
import type { CreateContractInput, UpdateContractInput } from "@/lib/validators/contract";

export type Contract = {
  contractId: string;
  contractNumber: string;
  vendorId: string;
  startDate: string;
  expiryDate: string;
  contractValue: string | null;
  renewalStatus: string | null;
  documentPath: string | null;
  vendor?: { vendorId: string; vendorName: string };
};

export type ContractListParams = {
  page?: number;
  pageSize?: number;
  vendorId?: string;
  expiringBefore?: string;
};

export type PurchaseOrderSummary = {
  purchaseOrderId: string;
  poNumber: string;
  status: string;
  totalAmount: string;
  currency: string;
  poDate: string;
};

export function fetchContracts(params: ContractListParams) {
  return apiGetPage<Contract>(
    `/contracts${toQueryString({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      vendorId: params.vendorId,
      before: params.expiringBefore,
    })}`,
  );
}

export function fetchContract(id: string) {
  return apiGet<Contract>(`/contracts/${id}`);
}

export function fetchContractPurchaseOrders(id: string) {
  return apiGet<PurchaseOrderSummary[]>(`/contracts/${id}/purchase-orders`);
}

export function createContract(input: CreateContractInput) {
  const body: Record<string, unknown> = {
    contractNumber: input.contractNumber.trim(),
    vendorId: input.vendorId,
    startDate: input.startDate,
    expiryDate: input.expiryDate,
  };
  if (input.contractValue !== undefined) body.contractValue = input.contractValue;
  if (input.renewalStatus) body.renewalStatus = input.renewalStatus;
  return apiPost<Contract>("/contracts", body);
}

export function updateContract(id: string, input: UpdateContractInput) {
  const body: Record<string, unknown> = { ...input };
  if (input.vendorId) body.vendorId = input.vendorId;
  return apiPatch<Contract>(`/contracts/${id}`, body);
}

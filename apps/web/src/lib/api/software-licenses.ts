import { apiGet, apiGetPage, apiPatch, apiPost } from "./client";
import { toQueryString } from "./query-string";
import type { CreateLicenseInput, UpdateLicenseInput } from "@/lib/validators/software-license";

export type SoftwareLicense = {
  licenseId: string;
  softwareName: string;
  licenseKeyReference?: string;
  vendorId: string | null;
  purchaseOrderId: string | null;
  startDate: string;
  expiryDate: string;
  licenseQuantity: number;
  renewalCost: string | null;
  status: string;
  vendor?: { vendorId: string; vendorName: string } | null;
  purchaseOrder?: { purchaseOrderId: string; poNumber: string } | null;
};

export type LicenseListParams = {
  page?: number;
  pageSize?: number;
  /** ISO date — licenses expiring before this date */
  before?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

function cleanCreateBody(input: CreateLicenseInput) {
  const body: Record<string, unknown> = {
    softwareName: input.softwareName.trim(),
    startDate: input.startDate,
    expiryDate: input.expiryDate,
    licenseQuantity: input.licenseQuantity,
  };
  if (input.licenseKeyReference?.trim()) body.licenseKeyReference = input.licenseKeyReference.trim();
  if (input.vendorId?.trim()) body.vendorId = input.vendorId.trim();
  if (input.purchaseOrderId?.trim()) body.purchaseOrderId = input.purchaseOrderId.trim();
  if (input.renewalCost !== undefined) body.renewalCost = input.renewalCost;
  if (input.status?.trim()) body.status = input.status.trim();
  return body;
}

export function fetchSoftwareLicenses(params: LicenseListParams) {
  return apiGetPage<SoftwareLicense>(
    `/software-licenses${toQueryString({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      before: params.before,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
    })}`,
  );
}

export function fetchSoftwareLicense(id: string) {
  return apiGet<SoftwareLicense>(`/software-licenses/${id}`);
}

export function createSoftwareLicense(input: CreateLicenseInput) {
  return apiPost<SoftwareLicense>("/software-licenses", cleanCreateBody(input));
}

export function updateSoftwareLicense(id: string, input: UpdateLicenseInput) {
  const body: Record<string, unknown> = {};
  if (input.softwareName?.trim()) body.softwareName = input.softwareName.trim();
  if (input.licenseKeyReference !== undefined) {
    body.licenseKeyReference = input.licenseKeyReference?.trim() ? input.licenseKeyReference.trim() : null;
  }
  if (input.vendorId !== undefined) body.vendorId = input.vendorId?.trim() ? input.vendorId.trim() : null;
  if (input.purchaseOrderId !== undefined) {
    body.purchaseOrderId = input.purchaseOrderId?.trim() ? input.purchaseOrderId.trim() : null;
  }
  if (input.startDate) body.startDate = input.startDate;
  if (input.expiryDate) body.expiryDate = input.expiryDate;
  if (input.licenseQuantity !== undefined) body.licenseQuantity = input.licenseQuantity;
  if (input.renewalCost !== undefined) body.renewalCost = input.renewalCost;
  if (input.status?.trim()) body.status = input.status.trim();
  return apiPatch<SoftwareLicense>(`/software-licenses/${id}`, body);
}

export function renewSoftwareLicense(id: string) {
  return apiPost<unknown>(`/software-licenses/${id}/renew`, {});
}

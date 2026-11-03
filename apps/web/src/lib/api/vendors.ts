import { apiGet, apiGetPage, apiPatch, apiPost } from "./client";
import { toQueryString } from "./query-string";
import type { CreateVendorInput, UpdateVendorInput } from "@/lib/validators/vendor";

export type Vendor = {
  vendorId: string;
  vendorName: string;
  registrationNumber: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
};

export type VendorDetail = Vendor & {
  relationCounts?: {
    contracts: number;
    purchaseOrders: number;
    maintenanceRecords: number;
    softwareLicenses: number;
  };
};

export type VendorListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
};

function cleanOptional(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (v === "" || v === undefined) continue;
    out[k] = v;
  }
  return out;
}

export function fetchVendors(params: VendorListParams) {
  return apiGetPage<Vendor>(
    `/vendors${toQueryString({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      search: params.search,
      isActive: params.isActive === undefined ? undefined : params.isActive ? "true" : "false",
    })}`,
  );
}

export function fetchVendor(id: string) {
  return apiGet<VendorDetail>(`/vendors/${id}`);
}

export function createVendor(input: CreateVendorInput) {
  return apiPost<Vendor, CreateVendorInput>("/vendors", cleanOptional(input) as CreateVendorInput);
}

export function updateVendor(id: string, input: UpdateVendorInput) {
  return apiPatch<Vendor, UpdateVendorInput>(`/vendors/${id}`, cleanOptional(input) as UpdateVendorInput);
}

export function archiveVendor(id: string) {
  return apiPost<Vendor>(`/vendors/${id}/archive`);
}

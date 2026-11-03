import { apiGet, apiGetPage, apiPatch, apiPost } from "./client";
import { toQueryString } from "./query-string";
import type {
  CompleteMaintenanceInput,
  CreateMaintenanceInput,
  UpdateMaintenanceInput,
} from "@/lib/validators/maintenance";

export type MaintenanceRecord = {
  maintenanceId: string;
  assetId: string | null;
  contractId: string | null;
  vendorId: string | null;
  maintenanceType: string;
  requestDate: string;
  completionDate: string | null;
  status: string;
  cost: string | null;
  remarks: string | null;
  asset?: { assetId: string; assetCode: string; assetName: string } | null;
  vendor?: { vendorId: string; vendorName: string } | null;
  contract?: { contractId: string; contractNumber: string } | null;
};

export type MaintenanceListParams = {
  page?: number;
  pageSize?: number;
  status?: string;
  assetId?: string;
};

function cleanCreateBody(input: CreateMaintenanceInput) {
  const body: Record<string, unknown> = {
    maintenanceType: input.maintenanceType.trim(),
    requestDate: input.requestDate,
  };
  if (input.assetId?.trim()) body.assetId = input.assetId.trim();
  if (input.contractId?.trim()) body.contractId = input.contractId.trim();
  if (input.vendorId?.trim()) body.vendorId = input.vendorId.trim();
  if (input.cost !== undefined) body.cost = input.cost;
  if (input.remarks?.trim()) body.remarks = input.remarks.trim();
  return body;
}

export function fetchMaintenanceRecords(params: MaintenanceListParams) {
  return apiGetPage<MaintenanceRecord>(
    `/maintenance-records${toQueryString({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      status: params.status,
      assetId: params.assetId,
    })}`,
  );
}

export function fetchMaintenanceRecord(id: string) {
  return apiGet<MaintenanceRecord>(`/maintenance-records/${id}`);
}

export function createMaintenanceRecord(input: CreateMaintenanceInput) {
  return apiPost<MaintenanceRecord>("/maintenance-records", cleanCreateBody(input));
}

export function updateMaintenanceRecord(id: string, input: UpdateMaintenanceInput) {
  const body: Record<string, unknown> = {};
  if (input.maintenanceType?.trim()) body.maintenanceType = input.maintenanceType.trim();
  if (input.vendorId !== undefined) body.vendorId = input.vendorId?.trim() ? input.vendorId.trim() : null;
  if (input.contractId !== undefined) body.contractId = input.contractId?.trim() ? input.contractId.trim() : null;
  if (input.cost !== undefined) body.cost = input.cost;
  if (input.remarks !== undefined) body.remarks = input.remarks?.trim() ? input.remarks.trim() : null;
  return apiPatch<MaintenanceRecord>(`/maintenance-records/${id}`, body);
}

export function completeMaintenanceRecord(id: string, input: CompleteMaintenanceInput) {
  const body: Record<string, unknown> = { completionDate: input.completionDate };
  if (input.cost !== undefined) body.cost = input.cost;
  if (input.remarks?.trim()) body.remarks = input.remarks.trim();
  return apiPost<MaintenanceRecord>(`/maintenance-records/${id}/complete`, body);
}

import { apiGet, apiGetPage, apiPatch, apiPost } from "./client";
import { toQueryString } from "./query-string";
import type { CreateEmployeeInput, UpdateEmployeeInput } from "@/lib/validators/employee";

export type Employee = {
  employeeId: string;
  employeeNumber: string;
  fullName: string;
  department: string | null;
  designation: string | null;
  contactNumber: string | null;
  email: string | null;
  isActive: boolean;
};

export type EmployeeListParams = {
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

export function fetchEmployees(params: EmployeeListParams) {
  return apiGetPage<Employee>(
    `/employees${toQueryString({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      search: params.search,
      isActive: params.isActive === undefined ? undefined : params.isActive ? "true" : "false",
    })}`,
  );
}

export function fetchEmployee(id: string) {
  return apiGet<Employee>(`/employees/${id}`);
}

export function createEmployee(input: CreateEmployeeInput) {
  return apiPost<Employee, CreateEmployeeInput>("/employees", cleanOptional(input) as CreateEmployeeInput);
}

export function updateEmployee(id: string, input: UpdateEmployeeInput) {
  return apiPatch<Employee, UpdateEmployeeInput>(`/employees/${id}`, cleanOptional(input) as UpdateEmployeeInput);
}

export function deactivateEmployee(id: string) {
  return apiPost<Employee>(`/employees/${id}/deactivate`);
}

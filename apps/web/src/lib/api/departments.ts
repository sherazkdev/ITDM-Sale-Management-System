import { apiGet, apiGetPage, apiPatch, apiPost } from "./client";
import { toQueryString } from "./query-string";

export type Department = {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  description: string | null;
  isActive: boolean;
  _count?: { employees: number };
};

export type DepartmentListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
};

export type CreateDepartmentInput = {
  departmentName: string;
  departmentCode?: string;
  description?: string;
};

export type UpdateDepartmentInput = {
  departmentName?: string;
  description?: string | null;
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

export function fetchDepartments(params: DepartmentListParams) {
  return apiGetPage<Department>(
    `/departments${toQueryString({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      search: params.search,
      isActive: params.isActive === undefined ? undefined : params.isActive ? "true" : "false",
    })}`,
  );
}

export function fetchDepartment(id: string) {
  return apiGet<Department>(`/departments/${encodeURIComponent(id)}`);
}

export function createDepartment(input: CreateDepartmentInput) {
  return apiPost<Department, CreateDepartmentInput>(
    "/departments",
    cleanOptional(input) as CreateDepartmentInput,
  );
}

export function updateDepartment(id: string, input: UpdateDepartmentInput) {
  return apiPatch<Department, UpdateDepartmentInput>(
    `/departments/${encodeURIComponent(id)}`,
    cleanOptional(input) as UpdateDepartmentInput,
  );
}

/** Active departments for searchable selects (bounded page size). */
export async function fetchDepartmentSelectOptions(search?: string) {
  const page = await fetchDepartments({ page: 1, pageSize: 500, isActive: true, search });
  return page.data.map((d) => ({
    value: d.departmentId,
    label: d.departmentName,
    hint: d.departmentCode,
  }));
}

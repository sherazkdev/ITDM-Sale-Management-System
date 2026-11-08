import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./client";

export type RolePermissionRow = {
  permission: {
    permissionId: string;
    permissionKey: string;
    description: string | null;
  };
};

export type RoleAdminItem = {
  roleId: string;
  roleKey: string;
  displayName: string;
  description: string | null;
  isActive: boolean;
  isSystem: boolean;
  colorKey: string | null;
  rolePermissions: RolePermissionRow[];
  _count?: { userRoles: number };
};

export type CreateRoleInput = {
  displayName: string;
  description?: string;
  colorKey?: string;
};

export type UpdateRoleInput = {
  displayName?: string;
  description?: string | null;
  isActive?: boolean;
  colorKey?: string | null;
};

export type SetRolePermissionsInput = {
  permissionKeys: string[];
};

export function fetchRoles() {
  return apiGet<RoleAdminItem[]>("/roles");
}

export function fetchPermissionCatalog() {
  return apiGet<Array<{ permissionId: string; permissionKey: string; description: string | null }>>(
    "/roles/permissions/catalog",
  );
}

export function createRole(input: CreateRoleInput) {
  return apiPost<RoleAdminItem, CreateRoleInput>("/roles", input);
}

export function updateRole(roleId: string, input: UpdateRoleInput) {
  return apiPatch<RoleAdminItem, UpdateRoleInput>(`/roles/${encodeURIComponent(roleId)}`, input);
}

export function setRolePermissions(roleId: string, input: SetRolePermissionsInput) {
  return apiPut<RoleAdminItem, SetRolePermissionsInput>(
    `/roles/${encodeURIComponent(roleId)}/permissions`,
    input,
  );
}

export function deleteRole(roleId: string) {
  return apiDelete<{ deleted: boolean }>(`/roles/${encodeURIComponent(roleId)}`);
}

export function rolePermissionKeys(role: RoleAdminItem): string[] {
  return role.rolePermissions.map((rp) => rp.permission.permissionKey);
}

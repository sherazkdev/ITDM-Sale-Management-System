import { apiGet, apiPatch, apiPost, apiPut } from "./client";
import type { CreateAdminUserInput, SetUserRolesInput, UpdateAdminUserInput } from "@/lib/validators/admin-user";

export type AdminRole = {
  roleId: string;
  roleKey: string;
  displayName: string;
};

export type AdminUser = {
  userId: string;
  username: string;
  displayName: string;
  email: string | null;
  isActive: boolean;
  isLocked: boolean;
  userRoles: Array<{ role: AdminRole }>;
};

export async function fetchAdminUsers() {
  return apiGet<AdminUser[]>("/users");
}

export async function fetchAdminRoles() {
  return apiGet<AdminRole[]>("/users/roles");
}

export async function createAdminUser(input: CreateAdminUserInput) {
  return apiPost<AdminUser>("/users", input);
}

export async function updateAdminUser(userId: string, input: UpdateAdminUserInput) {
  return apiPatch<AdminUser>(`/users/${encodeURIComponent(userId)}`, input);
}

export async function setAdminUserRoles(userId: string, input: SetUserRolesInput) {
  return apiPut<AdminUser>(`/users/${encodeURIComponent(userId)}/roles`, input);
}

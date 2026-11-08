"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRole,
  deleteRole,
  fetchRoles,
  setRolePermissions,
  updateRole,
  type CreateRoleInput,
  type RoleAdminItem,
  type UpdateRoleInput,
} from "@/lib/api/roles-admin";

export type RoleFormInput = Omit<CreateRoleInput, "description"> & {
  description?: string | null;
  permissionKeys?: string[];
};

const ROLES_KEY = ["roles", "admin", "list"] as const;

export function useRoles(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ROLES_KEY,
    queryFn: async () => {
      const data = await fetchRoles();
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RoleFormInput) => {
      const { permissionKeys, description, ...meta } = input;
      const role = await createRole({
        ...meta,
        ...(description ? { description } : {}),
      });
      if (permissionKeys?.length) {
        return setRolePermissions(role.roleId, { permissionKeys });
      }
      return role;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, permissionKeys, ...meta }: RoleFormInput & { id: string }) => {
      const hasMeta = Object.keys(meta).length > 0;
      const role = hasMeta ? await updateRole(id, meta as UpdateRoleInput) : undefined;
      if (permissionKeys !== undefined) {
        return setRolePermissions(id, { permissionKeys });
      }
      return role ?? (await fetchRoles()).find((r) => r.roleId === id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export type { RoleAdminItem };

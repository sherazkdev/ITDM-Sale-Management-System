import { z } from "zod";

export const createRoleSchema = z.object({
  displayName: z.string().min(1).max(128),
  description: z.string().max(4000).optional(),
  colorKey: z.string().max(32).optional(),
});

export const updateRoleSchema = z.object({
  displayName: z.string().min(1).max(128).optional(),
  description: z.string().max(4000).nullable().optional(),
  isActive: z.boolean().optional(),
  colorKey: z.string().max(32).nullable().optional(),
});

export const setRolePermissionsSchema = z.object({
  permissionKeys: z.array(z.string().min(1).max(128)),
});

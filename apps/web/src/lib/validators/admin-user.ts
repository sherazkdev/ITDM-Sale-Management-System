import { z } from "zod";

export const createAdminUserSchema = z.object({
  username: z.string().min(3).max(128),
  displayName: z.string().min(1).max(255),
  password: z.string().min(12).max(128),
  email: z.string().email().max(255).optional(),
  roleKeys: z.array(z.string().min(1).max(64)).min(1),
});

export const updateAdminUserSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).nullable().optional(),
  isActive: z.boolean().optional(),
  isLocked: z.boolean().optional(),
});

export const setUserRolesSchema = z.object({
  roleKeys: z.array(z.string().min(1).max(64)),
});

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>;
export type SetUserRolesInput = z.infer<typeof setUserRolesSchema>;

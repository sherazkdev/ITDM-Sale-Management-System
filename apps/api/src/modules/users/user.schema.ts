import { z } from "zod";

export const createUserSchema = z.object({
  username: z.string().min(3).max(128),
  displayName: z.string().min(1).max(255),
  password: z.string().min(12).max(128),
  email: z.string().email().max(255).optional(),
  roleKeys: z.array(z.string().min(1).max(64)).min(1),
});

export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).nullable().optional(),
  isActive: z.boolean().optional(),
  isLocked: z.boolean().optional(),
});

export const setUserRolesSchema = z.object({
  roleKeys: z.array(z.string().min(1).max(64)),
});

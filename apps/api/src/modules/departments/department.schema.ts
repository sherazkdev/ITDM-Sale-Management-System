import { z } from "zod";

export const createDepartmentSchema = z.object({
  departmentName: z.string().min(1).max(255),
  departmentCode: z.string().min(1).max(64).optional(),
  description: z.string().max(4000).optional(),
});

export const updateDepartmentSchema = z.object({
  departmentName: z.string().min(1).max(255).optional(),
  description: z.string().max(4000).nullable().optional(),
  isActive: z.boolean().optional(),
});

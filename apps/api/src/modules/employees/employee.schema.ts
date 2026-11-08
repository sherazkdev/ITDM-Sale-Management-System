import { z } from "zod";

export const createEmployeeSchema = z.object({
  employeeNumber: z.string().min(1).max(64),
  fullName: z.string().min(1).max(255),
  departmentId: z.coerce.bigint().optional(),
  department: z.string().max(128).optional(),
  designation: z.string().max(128).optional(),
  contactNumber: z.string().max(64).optional(),
  email: z.string().email().max(255).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().omit({ employeeNumber: true });

export const employeeIdParamSchema = z.object({
  id: z.coerce.bigint(),
});

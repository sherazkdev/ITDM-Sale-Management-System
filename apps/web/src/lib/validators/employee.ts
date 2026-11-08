import { z } from "zod";

export const createEmployeeSchema = z.object({
  employeeNumber: z.string().min(1, "Employee number is required").max(64),
  fullName: z.string().min(1, "Full name is required").max(255),
  departmentId: z.string().regex(/^\d+$/).optional().or(z.literal("")),
  department: z.string().max(128).optional().or(z.literal("")),
  designation: z.string().max(128).optional().or(z.literal("")),
  contactNumber: z.string().max(64).optional().or(z.literal("")),
  email: z.union([z.string().email().max(255), z.literal("")]).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.omit({ employeeNumber: true }).partial();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

import { z } from "zod";

export const createVendorSchema = z.object({
  vendorName: z.string().min(1, "Vendor name is required").max(255),
  registrationNumber: z.string().max(128).optional().or(z.literal("")),
  contactPerson: z.string().max(255).optional().or(z.literal("")),
  phone: z.string().max(64).optional().or(z.literal("")),
  email: z.union([z.string().email().max(255), z.literal("")]).optional(),
  address: z.string().max(4000).optional().or(z.literal("")),
});

export const updateVendorSchema = createVendorSchema.partial();

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;

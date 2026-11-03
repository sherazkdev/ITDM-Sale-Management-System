import { z } from "zod";

export const createVendorSchema = z.object({
  vendorName: z.string().min(1).max(255),
  registrationNumber: z.string().max(128).optional(),
  contactPerson: z.string().max(255).optional(),
  phone: z.string().max(64).optional(),
  email: z.string().email().max(255).optional(),
  address: z.string().max(4000).optional(),
});

export const updateVendorSchema = createVendorSchema.partial();

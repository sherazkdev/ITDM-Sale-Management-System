import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const createLicenseSchema = z.object({
  softwareName: z.string().min(1, "Software name is required").max(255),
  licenseKeyReference: z.string().max(255).optional().or(z.literal("")),
  vendorId: z.string().optional().or(z.literal("")),
  purchaseOrderId: z.string().optional().or(z.literal("")),
  startDate: dateOnly,
  expiryDate: dateOnly,
  licenseQuantity: z.coerce.number().int().positive("Quantity must be at least 1"),
  renewalCost: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
  status: z.string().max(64).optional().or(z.literal("")),
});

export const updateLicenseSchema = createLicenseSchema.partial().extend({
  softwareName: z.string().min(1).max(255).optional(),
});

export type CreateLicenseInput = z.infer<typeof createLicenseSchema>;
export type UpdateLicenseInput = z.infer<typeof updateLicenseSchema>;

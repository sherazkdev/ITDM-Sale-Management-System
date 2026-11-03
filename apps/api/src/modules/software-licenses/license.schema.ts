import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createLicenseSchema = z.object({
  softwareName: z.string().min(1).max(255),
  licenseKeyReference: z.string().max(255).optional(),
  vendorId: z.coerce.bigint().optional(),
  purchaseOrderId: z.coerce.bigint().optional(),
  startDate: dateOnly,
  expiryDate: dateOnly,
  licenseQuantity: z.number().int().positive(),
  renewalCost: z.coerce.number().nonnegative().optional(),
  status: z.string().min(1).max(64).optional(),
});

export const updateLicenseSchema = createLicenseSchema.partial().omit({ softwareName: true }).extend({
  softwareName: z.string().min(1).max(255).optional(),
});

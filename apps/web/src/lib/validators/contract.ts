import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const createContractSchema = z.object({
  contractNumber: z.string().min(1, "Contract number is required").max(64),
  vendorId: z.string().min(1, "Vendor is required"),
  startDate: dateOnly,
  expiryDate: dateOnly,
  contractValue: z.coerce.number().nonnegative().optional().or(z.nan()).transform((v) => (Number.isNaN(v) ? undefined : v)),
  renewalStatus: z.string().max(64).optional().or(z.literal("")),
});

export const updateContractSchema = createContractSchema.omit({ contractNumber: true }).partial();

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;

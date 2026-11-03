import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createContractSchema = z.object({
  contractNumber: z.string().min(1).max(64),
  vendorId: z.coerce.bigint(),
  startDate: dateOnly,
  expiryDate: dateOnly,
  contractValue: z.coerce.number().nonnegative().optional(),
  renewalStatus: z.string().max(64).optional(),
});

export const updateContractSchema = createContractSchema.partial().omit({ contractNumber: true });

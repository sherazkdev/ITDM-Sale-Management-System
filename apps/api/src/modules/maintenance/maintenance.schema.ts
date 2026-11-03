import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createMaintenanceSchema = z
  .object({
    assetId: z.coerce.bigint().optional(),
    contractId: z.coerce.bigint().optional(),
    vendorId: z.coerce.bigint().optional(),
    maintenanceType: z.string().min(1).max(128),
    requestDate: dateOnly,
    cost: z.coerce.number().nonnegative().optional(),
    remarks: z.string().max(4000).optional(),
  })
  .refine((v) => v.assetId || v.contractId || v.vendorId, {
    message: "At least one of assetId, contractId, or vendorId is required",
  });

export const updateMaintenanceSchema = z.object({
  maintenanceType: z.string().min(1).max(128).optional(),
  vendorId: z.coerce.bigint().nullable().optional(),
  contractId: z.coerce.bigint().nullable().optional(),
  cost: z.coerce.number().nonnegative().optional(),
  remarks: z.string().max(4000).optional(),
});

export const completeMaintenanceSchema = z.object({
  completionDate: dateOnly,
  cost: z.coerce.number().nonnegative().optional(),
  remarks: z.string().max(4000).optional(),
});

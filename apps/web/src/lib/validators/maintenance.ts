import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const createMaintenanceSchema = z
  .object({
    assetId: z.string().optional().or(z.literal("")),
    contractId: z.string().optional().or(z.literal("")),
    vendorId: z.string().optional().or(z.literal("")),
    maintenanceType: z.string().min(1, "Type is required").max(128),
    requestDate: dateOnly,
    cost: z.preprocess(
      (value) => (value === "" || value === undefined ? undefined : value),
      z.coerce.number().nonnegative().optional(),
    ),
    remarks: z.string().max(4000).optional().or(z.literal("")),
  })
  .refine((v) => Boolean(v.assetId || v.contractId || v.vendorId), {
    message: "Link at least one of asset, contract, or vendor",
    path: ["assetId"],
  });

export const updateMaintenanceSchema = z.object({
  maintenanceType: z.string().min(1).max(128).optional().or(z.literal("")),
  vendorId: z.string().optional().or(z.literal("")),
  contractId: z.string().optional().or(z.literal("")),
  cost: z.coerce.number().nonnegative().optional().or(z.nan()).transform((v) => (Number.isNaN(v) ? undefined : v)),
  remarks: z.string().max(4000).optional().or(z.literal("")),
});

export const completeMaintenanceSchema = z.object({
  completionDate: dateOnly,
  cost: z.coerce.number().nonnegative().optional().or(z.nan()).transform((v) => (Number.isNaN(v) ? undefined : v)),
  remarks: z.string().max(4000).optional().or(z.literal("")),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
export type CompleteMaintenanceInput = z.infer<typeof completeMaintenanceSchema>;

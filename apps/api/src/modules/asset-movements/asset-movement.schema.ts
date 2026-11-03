import { z } from "zod";

const movementLineSchema = z.object({
  assetId: z.coerce.bigint(),
  conditionNotes: z.string().max(4000).optional(),
});

export const issueAssetsSchema = z.object({
  employeeId: z.coerce.bigint(),
  referenceNumber: z.string().max(64).optional(),
  occurredAt: z.string().datetime().optional(),
  assets: z.array(movementLineSchema).min(1),
});

export const returnAssetsSchema = z.object({
  employeeId: z.coerce.bigint(),
  referenceNumber: z.string().max(64).optional(),
  occurredAt: z.string().datetime().optional(),
  assets: z.array(movementLineSchema).min(1),
});

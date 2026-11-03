import { z } from "zod";

const movementLineSchema = z.object({
  assetId: z.string().min(1),
  conditionNotes: z.string().max(4000).optional().or(z.literal("")),
});

export const issueAssetsSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  referenceNumber: z.string().max(64).optional().or(z.literal("")),
  occurredAt: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().datetime().optional(),
  ),
  assets: z.array(movementLineSchema).min(1, "Select at least one asset"),
});

export const returnAssetsSchema = issueAssetsSchema;

export type IssueAssetsInput = z.infer<typeof issueAssetsSchema>;
export type ReturnAssetsInput = z.infer<typeof returnAssetsSchema>;

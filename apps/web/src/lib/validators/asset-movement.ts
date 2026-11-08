import { z } from "zod";

const movementLineSchema = z.object({
  assetId: z.string().min(1),
  conditionNotes: z.string().max(4000).optional().or(z.literal("")),
});

const movementHeaderSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  referenceNumber: z.string().max(64).optional().or(z.literal("")),
  occurredAt: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().datetime().optional(),
  ),
  assets: z.array(movementLineSchema).min(1, "Select at least one asset"),
});

export const issueAssetsSchema = movementHeaderSchema.extend({
  receivingDepartment: z
    .string()
    .max(128, "Department is too long")
    .min(1, "Receiving department is required"),
});

export const returnAssetsSchema = movementHeaderSchema;

export type IssueAssetsInput = z.infer<typeof issueAssetsSchema>;
export type ReturnAssetsInput = z.infer<typeof returnAssetsSchema>;

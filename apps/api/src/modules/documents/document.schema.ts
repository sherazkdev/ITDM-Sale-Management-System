import { z } from "zod";

export const uploadDocumentSchema = z.object({
  ownerType: z.enum(["purchase_order", "contract", "invoice", "maintenance_record"]),
  ownerId: z.string().min(1).max(64),
  originalFileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(128),
  contentBase64: z
    .string()
    .min(1)
    .max(14_000_000, "Encoded file exceeds maximum upload size"),
});

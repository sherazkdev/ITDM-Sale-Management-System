import { z } from "zod";

export const DOCUMENT_OWNER_TYPES = [
  "purchase_order",
  "contract",
  "invoice",
  "maintenance_record",
] as const;

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const uploadDocumentSchema = z.object({
  ownerType: z.enum(DOCUMENT_OWNER_TYPES),
  ownerId: z.string().min(1).max(64),
  originalFileName: z.string().min(1).max(255),
  mimeType: z.enum(ALLOWED_UPLOAD_MIME_TYPES),
  contentBase64: z.string().min(1),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

export const documentLookupSchema = z.object({
  documentId: z.string().regex(/^\d+$/, "Enter a numeric document id"),
});

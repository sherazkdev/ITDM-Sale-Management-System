import { apiFetchBinary, apiGet, apiPost, saveBlobAsFile } from "./client";
import type { UploadDocumentInput } from "@/lib/validators/document";

export type DocumentMetadata = {
  storedDocumentId: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: string;
  sha256: string;
  createdAt: string;
  link?: {
    ownerType: string;
    ownerId: string;
  } | null;
};

export async function uploadDocument(input: UploadDocumentInput) {
  return apiPost<DocumentMetadata>("/documents/uploads", input);
}

export async function fetchDocumentMetadata(documentId: string) {
  return apiGet<DocumentMetadata>(`/documents/${encodeURIComponent(documentId)}/metadata`);
}

export async function downloadDocument(documentId: string, fallbackFileName?: string) {
  const { blob, headers } = await apiFetchBinary(
    `/documents/${encodeURIComponent(documentId)}/download`,
  );
  const disposition = headers.get("Content-Disposition") ?? "";
  const match = /filename="([^"]+)"/.exec(disposition);
  const fileName = match?.[1] ?? fallbackFileName ?? `document-${documentId}`;
  saveBlobAsFile(blob, fileName);
}

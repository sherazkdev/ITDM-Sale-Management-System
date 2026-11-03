"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Files, Upload } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { QuickTip } from "@/components/common/QuickTip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/common/FilterSelect";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import {
  downloadDocument,
  fetchDocumentMetadata,
  uploadDocument,
  type DocumentMetadata,
} from "@/lib/api/documents";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  DOCUMENT_OWNER_TYPES,
  MAX_UPLOAD_BYTES,
  documentLookupSchema,
  uploadDocumentSchema,
  type UploadDocumentInput,
} from "@/lib/validators/document";
import { ApiClientError } from "@/lib/api/client";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read file"));
        return;
      }
      const base64 = result.includes(",") ? result.split(",")[1]! : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}

function MetadataPanel({ doc }: { doc: DocumentMetadata }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 text-sm">
      <div>
        <dt className="text-xs text-muted-foreground">File name</dt>
        <dd>{doc.originalFileName}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">MIME type</dt>
        <dd>{doc.mimeType}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Size</dt>
        <dd>{Number(doc.sizeBytes).toLocaleString()} bytes</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Uploaded</dt>
        <dd>{doc.createdAt}</dd>
      </div>
      {doc.link && (
        <>
          <div>
            <dt className="text-xs text-muted-foreground">Owner type</dt>
            <dd>{doc.link.ownerType}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Owner id</dt>
            <dd className="font-mono text-xs">{doc.link.ownerId}</dd>
          </div>
        </>
      )}
    </dl>
  );
}

export default function DocumentsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionKeys.documentsManage);
  const canRead = hasPermission(PermissionKeys.documentsRead);

  const [lookupInput, setLookupInput] = useState("");
  const [lookupId, setLookupId] = useState("");
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const metadataQuery = useQuery({
    queryKey: ["document-metadata", lookupId],
    queryFn: () => fetchDocumentMetadata(lookupId),
    enabled: Boolean(lookupId) && canRead,
    retry: (count, err) => {
      if (err instanceof ApiClientError && (err.status === 404 || err.status === 403)) return false;
      return count < 1;
    },
  });

  const uploadForm = useForm<UploadDocumentInput>({
    resolver: zodResolver(uploadDocumentSchema),
    defaultValues: {
      ownerType: "purchase_order",
      ownerId: "",
      originalFileName: "",
      mimeType: "application/pdf",
      contentBase64: "",
    },
  });

  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: (row) => {
      toast.success(`Uploaded document #${row.storedDocumentId}`);
      setLookupId(row.storedDocumentId);
      uploadForm.reset({
        ownerType: uploadForm.getValues("ownerType"),
        ownerId: uploadForm.getValues("ownerId"),
        originalFileName: "",
        mimeType: "application/pdf",
        contentBase64: "",
      });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Upload failed");
    },
    onSettled: () => setUploadProgress(null),
  });

  async function onPickFile(file: File | null) {
    if (!file) return;
    if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.type as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number])) {
      toast.error("File type not allowed for upload");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("File exceeds 10MB limit");
      return;
    }
    setUploadProgress("Encoding file…");
    try {
      const contentBase64 = await fileToBase64(file);
      uploadForm.setValue("originalFileName", file.name, { shouldValidate: true });
      uploadForm.setValue("mimeType", file.type as UploadDocumentInput["mimeType"], { shouldValidate: true });
      uploadForm.setValue("contentBase64", contentBase64, { shouldValidate: true });
      setUploadProgress(null);
    } catch {
      setUploadProgress(null);
      toast.error("Could not read file");
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Documents"
        description="Upload and link files to purchase orders, contracts, invoices, or maintenance records."
      />

      <QuickTip title="Access control">
        Downloads and metadata require <code className="text-xs">documents.read</code>. Upload requires{" "}
        <code className="text-xs">documents.manage</code>. Files are stored server-side — no public URLs.
      </QuickTip>

      {canManage && (
        <SectionCard title="Upload document">
          <form
            className="space-y-4"
            onSubmit={uploadForm.handleSubmit((values) => {
              setUploadProgress("Uploading…");
              uploadMutation.mutate(values);
            })}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Owner type</label>
                <FilterSelect
                  value={uploadForm.watch("ownerType")}
                  onChange={(v) =>
                    uploadForm.setValue("ownerType", v as UploadDocumentInput["ownerType"], { shouldValidate: true })
                  }
                  options={DOCUMENT_OWNER_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ") }))}
                  placeholder="Owner type"
                  aria-label="Owner type"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground" htmlFor="owner-id">
                  Owner id
                </label>
                <Input id="owner-id" {...uploadForm.register("ownerId")} placeholder="Numeric record id" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground" htmlFor="doc-file">
                File (max 10MB)
              </label>
              <Input
                id="doc-file"
                type="file"
                accept={ALLOWED_UPLOAD_MIME_TYPES.join(",")}
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
              {uploadForm.watch("originalFileName") && (
                <p className="mt-1 text-xs text-muted-foreground">Selected: {uploadForm.watch("originalFileName")}</p>
              )}
            </div>
            {uploadProgress && <p className="text-sm text-muted-foreground">{uploadProgress}</p>}
            <Button type="submit" disabled={uploadMutation.isPending || !uploadForm.watch("contentBase64")}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </form>
        </SectionCard>
      )}

      {canRead && (
        <SectionCard title="Document lookup">
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              const parsed = documentLookupSchema.safeParse({ documentId: lookupInput.trim() });
              if (!parsed.success) {
                toast.error(parsed.error.issues[0]?.message ?? "Invalid id");
                return;
              }
              setLookupId(parsed.data.documentId);
            }}
          >
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="doc-id">
                Stored document id
              </label>
              <Input
                id="doc-id"
                value={lookupInput}
                onChange={(e) => setLookupInput(e.target.value)}
                placeholder="From upload response or PO search"
              />
            </div>
            <Button type="submit">Load metadata</Button>
          </form>

          {metadataQuery.isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading…</p>}
          {metadataQuery.isError && (
            <p className="mt-4 text-sm text-destructive">
              {metadataQuery.error instanceof ApiClientError
                ? metadataQuery.error.message
                : "Could not load document"}
            </p>
          )}
          {metadataQuery.data && (
            <div className="mt-4 space-y-4">
              <MetadataPanel doc={metadataQuery.data} />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  downloadDocument(metadataQuery.data!.storedDocumentId, metadataQuery.data!.originalFileName).catch(
                    (err) => toast.error(err instanceof ApiClientError ? err.message : "Download failed"),
                  )
                }
              >
                Download authorized copy
              </Button>
            </div>
          )}
        </SectionCard>
      )}

      {!canRead && !canManage && (
        <EmptyState icon={Files} title="No document permissions" description="Your account cannot access documents." />
      )}
    </div>
  );
}

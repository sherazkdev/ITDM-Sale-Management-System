"use client";

import { useCallback, useRef, useState, type DragEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, Upload } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ApiClientError } from "@/lib/api/client";
import {
  postEntityImport,
  postEntityImportPreview,
  type EntityImportPreviewResult,
  type EntityImportResult,
} from "@/lib/api/user-profile";
import {
  ALLOWED_IMPORT_EXTENSIONS,
  ENTITY_CONFIG,
  sampleCsvForEntity,
  downloadTextFile,
  type ItdmsEntityKind,
} from "@/lib/itdms-import-export-config";
import { cn } from "@/lib/utils";

type ImportModalProps = {
  entity: ItdmsEntityKind;
  trigger?: ReactNode;
  onSuccess?: () => void;
  disabled?: boolean;
};

type Step = "select" | "preview" | "result";

const MAX_BYTES = 5 * 1024 * 1024;

function isAllowedFile(file: File): boolean {
  const ext = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  return (ALLOWED_IMPORT_EXTENSIONS as readonly string[]).includes(ext);
}

const STATUS_LABEL: Record<string, string> = {
  valid: "Ready",
  duplicate: "Duplicate",
  invalid: "Invalid",
};

export function ImportModal({ entity, trigger, onSuccess, disabled }: ImportModalProps) {
  const config = ENTITY_CONFIG[entity];
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("select");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<EntityImportPreviewResult | null>(null);
  const [result, setResult] = useState<EntityImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setStep("select");
    setFile(null);
    setError(null);
    setPreview(null);
    setResult(null);
    setDragOver(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const validateFile = (next: File): string | null => {
    if (!isAllowedFile(next)) {
      return "Allowed file types: CSV, XLSX, XLS.";
    }
    if (next.size > MAX_BYTES) {
      return "File must be 5 MB or smaller.";
    }
    return null;
  };

  const pickFile = (next: File | null) => {
    if (!next) return;
    const msg = validateFile(next);
    if (msg) {
      setError(msg);
      setFile(null);
      setPreview(null);
      setStep("select");
      return;
    }
    setError(null);
    setPreview(null);
    setResult(null);
    setFile(next);
    setStep("select");
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files[0] ?? null);
  };

  const runPreview = async () => {
    if (!config.importApiPath || !file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await postEntityImportPreview(config.importApiPath, file);
      setPreview(data);
      setStep("preview");
      if (data.validCount === 0) {
        setError("No importable rows were found. Fix errors and preview again.");
      }
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Preview failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!config.importApiPath || !file || !preview?.validCount) return;
    setLoading(true);
    setError(null);
    try {
      const data = await postEntityImport(config.importApiPath, file);
      setResult(data);
      setStep("result");
      if (data.imported > 0) {
        for (const key of config.invalidateQueryKeys) {
          await queryClient.invalidateQueries({ queryKey: key });
        }
        onSuccess?.();
        toast.success(`Imported ${data.imported} ${config.entityLabel.toLowerCase()}.`);
      } else if (data.errors.length === 0 && data.skipped > 0) {
        toast.message("No new records imported.", {
          description: `${data.skipped} duplicate row(s) were skipped.`,
        });
      }
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Import failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = () => {
    downloadTextFile(sampleCsvForEntity(entity), `${entity}-sample.csv`);
  };

  if (!config.importApiPath) return null;

  const previewColumns = config.columns.map((c) => c.key);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="md" disabled={disabled}>
            <Upload className="h-4 w-4" /> Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import {config.entityLabel}</DialogTitle>
          <DialogDescription>
            {step === "select"
              ? "Choose a file, preview validation results, then confirm import."
              : step === "preview"
                ? "Review rows below. Only validated new records are imported on confirm."
                : "Import finished."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === "select" ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Sample format</p>
                <Button type="button" variant="outline" size="sm" onClick={downloadSample}>
                  <FileSpreadsheet className="h-4 w-4" /> Download sample CSV
                </Button>
              </div>

              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
                  dragOver ? "border-primary bg-primary/5" : "border-input hover:bg-muted/40",
                )}
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {file ? file.name : "Drag & drop a file here, or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground">CSV, XLSX, or XLS · max 5 MB</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </>
          ) : null}

          {step === "preview" && preview ? (
            <div className="space-y-3">
              <p className="text-sm">
                <span className="font-medium">{preview.validCount}</span> ready ·{" "}
                <span className="font-medium">{preview.duplicateCount}</span> duplicate ·{" "}
                <span className="font-medium">{preview.invalidCount}</span> invalid ·{" "}
                <span className="text-muted-foreground">{preview.totalRows} total rows</span>
              </p>
              <div className="overflow-x-auto rounded-lg border max-h-64">
                <table className="w-full min-w-[520px] text-left text-xs">
                  <thead className="bg-muted/60 sticky top-0">
                    <tr>
                      <th className="px-2 py-2">Row</th>
                      <th className="px-2 py-2">Status</th>
                      {previewColumns.map((key) => (
                        <th key={key} className="px-2 py-2 whitespace-nowrap">
                          {key}
                        </th>
                      ))}
                      <th className="px-2 py-2">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr key={row.row} className="border-t">
                        <td className="px-2 py-1.5">{row.row}</td>
                        <td className="px-2 py-1.5">{STATUS_LABEL[row.status] ?? row.status}</td>
                        {previewColumns.map((key) => (
                          <td key={key} className="px-2 py-1.5 text-muted-foreground whitespace-nowrap">
                            {row.values[key] ?? "—"}
                          </td>
                        ))}
                        <td className="px-2 py-1.5 text-destructive">{row.message ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {step === "result" && result ? (
            <div className="space-y-2 rounded-lg border bg-muted/30 px-3 py-3 text-sm">
              <div className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Import complete
              </div>
              <p>
                <span className="font-medium">{result.imported}</span> imported ·{" "}
                <span className="font-medium">{result.skipped}</span> skipped
              </p>
              {result.errors.length > 0 ? (
                <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-destructive">
                  {result.errors.slice(0, 8).map((e) => (
                    <li key={`${e.row}-${e.message}`}>
                      Row {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Close
          </Button>
          {step === "select" ? (
            <Button type="button" onClick={() => void runPreview()} disabled={loading || !file}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Validating…" : "Review import"}
            </Button>
          ) : null}
          {step === "preview" ? (
            <>
              <Button type="button" variant="outline" onClick={() => setStep("select")} disabled={loading}>
                Back
              </Button>
              <Button
                type="button"
                onClick={() => void handleConfirmImport()}
                disabled={loading || !preview?.validCount}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {loading ? "Importing…" : `Confirm import (${preview?.validCount ?? 0})`}
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

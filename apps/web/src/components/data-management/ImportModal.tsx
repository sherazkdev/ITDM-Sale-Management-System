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
import { postEntityImport, type EntityImportResult } from "@/lib/api/user-profile";
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

const MAX_BYTES = 5 * 1024 * 1024;

function isAllowedFile(file: File): boolean {
  const ext = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  return (ALLOWED_IMPORT_EXTENSIONS as readonly string[]).includes(ext);
}

export function ImportModal({ entity, trigger, onSuccess, disabled }: ImportModalProps) {
  const config = ENTITY_CONFIG[entity];
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EntityImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setFile(null);
    setError(null);
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
      return;
    }
    setError(null);
    setResult(null);
    setFile(next);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files[0] ?? null);
  };

  const handleImport = async () => {
    if (!config.importApiPath) {
      setError("Import is not available for this entity.");
      return;
    }
    if (!file) {
      setError("Choose a file to import.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await postEntityImport(config.importApiPath, file);
      setResult(data);

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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import {config.entityLabel}</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file ({ALLOWED_IMPORT_EXTENSIONS.join(", ")}). Required columns are
            marked with *.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Sample format</p>
            <Button type="button" variant="outline" size="sm" onClick={downloadSample}>
              <FileSpreadsheet className="h-4 w-4" /> Download sample CSV
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[480px] text-left text-xs">
              <thead className="bg-muted/60">
                <tr>
                  {config.columns.map((col) => (
                    <th key={col.key} className="px-3 py-2 font-medium whitespace-nowrap">
                      {col.label}
                      {col.required ? " *" : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  {config.columns.map((col) => (
                    <td key={col.key} className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                      {config.sampleRow[col.key] ?? col.example}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
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

          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {result ? (
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
                  {result.errors.length > 8 ? (
                    <li>…and {result.errors.length - 8} more error(s)</li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Close
          </Button>
          <Button type="button" onClick={handleImport} disabled={loading || !file}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {loading ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

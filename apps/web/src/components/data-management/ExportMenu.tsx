"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Download, ExternalLink, FileSpreadsheet, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ApiClientError, apiFetchBinary, saveBlobAsFile } from "@/lib/api/client";
import { toQueryString } from "@/lib/api/query-string";
import {
  ENTITY_CONFIG,
  exportFilename,
  type ExportFormat,
  type ExportScope,
  type ItdmsEntityKind,
} from "@/lib/itdms-import-export-config";

type ExportMenuProps = {
  entity: ItdmsEntityKind;
  filterParams?: Record<string, string | undefined>;
  selectedIds?: string[];
  disabled?: boolean;
};

const FORMATS: Array<{ format: ExportFormat; label: string; icon: typeof FileText }> = [
  { format: "csv", label: "CSV", icon: FileText },
  { format: "xlsx", label: "Excel (XLSX)", icon: FileSpreadsheet },
  { format: "pdf", label: "PDF", icon: FileText },
];

const SCOPES: Array<{ scope: ExportScope; label: string; disabled?: (p: ExportMenuProps) => boolean }> = [
  { scope: "selected", label: "Selected rows", disabled: (p) => !p.selectedIds?.length },
  { scope: "filtered", label: "Filtered results" },
  { scope: "all", label: "All records" },
];

function buildExportQuery(
  format: ExportFormat,
  scope: ExportScope,
  filterParams: Record<string, string | undefined>,
  selectedIds?: string[],
) {
  const params: Record<string, string | undefined> = {
    format,
    scope,
    ...filterParams,
  };
  if (scope === "selected" && selectedIds?.length) {
    params.ids = selectedIds.join(",");
  }
  return toQueryString(params);
}

export function ExportMenu({ entity, filterParams = {}, selectedIds, disabled }: ExportMenuProps) {
  const config = ENTITY_CONFIG[entity];
  const [loading, setLoading] = useState(false);

  const runExport = async (format: ExportFormat, scope: ExportScope) => {
    if (!config.exportMode) {
      toast.message("Use Reports for this export.", {
        description: "Asset categories are exported from the Reports module.",
      });
      return;
    }

    setLoading(true);
    try {
      const qs = buildExportQuery(format, scope, filterParams, selectedIds);
      const path =
        config.exportMode === "report" && config.reportSlug
          ? `/reports/${config.reportSlug}${qs}`
          : `${config.exportApiPath ?? ""}${qs}`;

      const { blob } = await apiFetchBinary(path);
      saveBlobAsFile(blob, exportFilename(entity, format));
      toast.success("Export downloaded.");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Export failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="md" disabled={disabled || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export as</DropdownMenuLabel>
        {config.exportMode ? (
          FORMATS.map(({ format, label, icon: Icon }) => (
            <DropdownMenuSub key={format}>
              <DropdownMenuSubTrigger>
                <Icon className="h-4 w-4" />
                {label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {SCOPES.map(({ scope, label: scopeLabel, disabled: scopeDisabled }) => {
                  const isDisabled =
                    scopeDisabled?.({ entity, filterParams, selectedIds }) ?? false;
                  return (
                    <DropdownMenuItem
                      key={scope}
                      disabled={isDisabled || loading}
                      onClick={() => void runExport(format, scope)}
                    >
                      {scopeLabel}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))
        ) : (
          <DropdownMenuItem asChild>
            <Link href={config.reportsHref} className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Open reports
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
          {exportFilename(entity, "csv")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

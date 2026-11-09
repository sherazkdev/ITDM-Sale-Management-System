"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ApiClientError, apiFetchBinary, saveBlobAsFile } from "@/lib/api/client";
import { toQueryString } from "@/lib/api/query-string";
import type { ReportFormat } from "@/lib/api/reports";
import {
  LIST_REPORT_EXPORT,
  type ListReportExportKey,
} from "@/lib/list-export-config";

type ReportListExportMenuProps = {
  listKey: ListReportExportKey;
  filterParams?: Record<string, string | undefined>;
  disabled?: boolean;
};

const FORMATS: Array<{ format: ReportFormat; label: string }> = [
  { format: "csv", label: "CSV" },
  { format: "xlsx", label: "Excel (XLSX)" },
  { format: "pdf", label: "PDF" },
];

export function ReportListExportMenu({
  listKey,
  filterParams = {},
  disabled,
}: ReportListExportMenuProps) {
  const spec = LIST_REPORT_EXPORT[listKey];
  const [loading, setLoading] = useState(false);

  const runExport = async (format: ReportFormat, scope: "all" | "filtered") => {
    setLoading(true);
    try {
      const params: Record<string, string | undefined> = {
        format,
        ...(scope === "filtered" ? filterParams : {}),
      };
      const qs = toQueryString(params);
      const path = `/reports/${spec.reportSlug}${qs}`;
      const { blob } = await apiFetchBinary(path);
      const ext = format === "xlsx" ? "xlsx" : format === "pdf" ? "pdf" : "csv";
      const date = new Date().toISOString().slice(0, 10);
      saveBlobAsFile(blob, `itdms-${listKey}-${date}.${ext}`);
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
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Export {spec.label}</DropdownMenuLabel>
        {FORMATS.map(({ format, label }) => (
          <DropdownMenuSub key={format}>
            <DropdownMenuSubTrigger>
              {format === "csv" ? <FileText className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
              {label}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem disabled={loading} onClick={() => void runExport(format, "all")}>
                All records
              </DropdownMenuItem>
              <DropdownMenuItem disabled={loading} onClick={() => void runExport(format, "filtered")}>
                Apply current filters
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

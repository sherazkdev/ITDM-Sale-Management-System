"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BarChart3, Download, FileJson } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { ExportDisclaimerNotice } from "@/components/reports/ExportDisclaimerNotice";
import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/common/FilterSelect";
import {
  REPORT_DEFINITIONS,
  downloadReportExport,
  fetchReportJson,
  type ReportFormat,
  type ReportSlug,
} from "@/lib/api/reports";
import { fetchFinancialYears } from "@/lib/api/budgets";
import { ApiClientError } from "@/lib/api/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const EXPORT_FORMATS: Array<Exclude<ReportFormat, "json">> = ["csv", "pdf", "xlsx"];

export default function ReportsPage() {
  const [financialYearId, setFinancialYearId] = useState("");
  const [previewSlug, setPreviewSlug] = useState<ReportSlug | null>(null);
  const [previewJson, setPreviewJson] = useState<unknown>(null);

  const yearsQuery = useQuery({
    queryKey: ["financial-years"],
    queryFn: fetchFinancialYears,
  });

  const previewMutation = useMutation({
    mutationFn: (slug: ReportSlug) =>
      fetchReportJson(slug, slug === "budget-utilization" ? financialYearId || undefined : undefined),
    onSuccess: (data, slug) => {
      setPreviewSlug(slug);
      setPreviewJson(data);
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Preview failed"),
  });

  const exportMutation = useMutation({
    mutationFn: ({
      slug,
      format,
    }: {
      slug: ReportSlug;
      format: Exclude<ReportFormat, "json">;
    }) =>
      downloadReportExport(
        slug,
        format,
        slug === "budget-utilization" ? financialYearId || undefined : undefined,
      ),
    onSuccess: (result) => {
      if (result.disclaimer) {
        toast.message("Provisional export downloaded", {
          description: "Header: NON-OFFICIAL-D12 — not an approved organizational template.",
        });
      } else {
        toast.success("Download started");
      }
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Export failed"),
  });

  return (
    <div className="page-stack">
      <PageHeader
        title="Reports & exports"
        description="JSON previews and downloadable CSV, PDF, or XLSX extracts from the API."
      />

      <ExportDisclaimerNotice />

      <SectionCard title="Budget report filter">
        <label className="text-xs font-medium text-muted-foreground block mb-2">Financial year (budget utilization only)</label>
        <FilterSelect
          value={financialYearId}
          onChange={setFinancialYearId}
          placeholder="All years (default)"
          options={(yearsQuery.data ?? []).map((y) => ({
            value: y.financialYearId,
            label: y.yearName,
          }))}
          aria-label="Financial year"
        />
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {REPORT_DEFINITIONS.map((report) => (
          <SectionCard key={report.slug} title={report.title}>
            <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
            {report.inventoryAlias && (
              <p className="text-xs text-muted-foreground mb-3">
                Inventory-style reporting uses the asset register endpoint until a separate inventory report exists.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={previewMutation.isPending}
                onClick={() => previewMutation.mutate(report.slug)}
              >
                <FileJson className="h-4 w-4 mr-1" />
                Preview JSON
              </Button>
              {EXPORT_FORMATS.map((format) => (
                <Button
                  key={format}
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={exportMutation.isPending}
                  onClick={() => exportMutation.mutate({ slug: report.slug, format })}
                >
                  <Download className="h-4 w-4 mr-1" />
                  {format.toUpperCase()}
                </Button>
              ))}
            </div>
          </SectionCard>
        ))}
      </div>

      {!REPORT_DEFINITIONS.length && (
        <SectionCard title="No reports">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            No report endpoints configured.
          </p>
        </SectionCard>
      )}

      <Dialog open={previewSlug !== null} onOpenChange={(open) => !open && setPreviewSlug(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>JSON preview — {previewSlug}</DialogTitle>
          </DialogHeader>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">{JSON.stringify(previewJson, null, 2)}</pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}

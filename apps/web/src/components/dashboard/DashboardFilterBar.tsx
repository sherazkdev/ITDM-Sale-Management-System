"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange } from "lucide-react";

import { useQuery } from "@tanstack/react-query";

import { FilterSelect } from "@/components/common/FilterSelect";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchDepartmentSelectOptions } from "@/lib/api/departments";
import { fetchFinancialYears } from "@/lib/api/budgets";
import { cn } from "@/lib/utils";

export type DashboardDatePreset = "current_month" | "last_30" | "current_year" | "custom";

export type DashboardDateRange = {
  preset: DashboardDatePreset;
  from: string;
  to: string;
};

const PRESET_OPTIONS = [
  { value: "current_month", label: "Current month" },
  { value: "last_30", label: "Last 30 days" },
  { value: "current_year", label: "Current year" },
  { value: "custom", label: "Custom range" },
] as const;

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function resolveDashboardRange(preset: DashboardDatePreset, from?: string, to?: string): DashboardDateRange {
  const now = new Date();
  const end = to && preset === "custom" ? to : toISODate(now);

  if (preset === "last_30") {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { preset, from: toISODate(start), to: end };
  }
  if (preset === "current_year") {
    const start = new Date(now.getFullYear(), 0, 1);
    return { preset, from: toISODate(start), to: end };
  }
  if (preset === "custom" && from) {
    return { preset, from, to: end };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { preset: "current_month", from: toISODate(start), to: end };
}

export function useDashboardFilterParams() {
  const searchParams = useSearchParams();
  return {
    departmentId: searchParams.get("departmentId") ?? undefined,
    financialYearId: searchParams.get("financialYearId") ?? undefined,
    poStatus: searchParams.get("poStatus") ?? undefined,
  };
}

export function useDashboardDateRange(): DashboardDateRange {
  const searchParams = useSearchParams();
  const presetRaw = searchParams.get("range") ?? "current_month";
  const preset = (PRESET_OPTIONS.some((o) => o.value === presetRaw)
    ? presetRaw
    : "current_month") as DashboardDatePreset;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  return useMemo(() => resolveDashboardRange(preset, from, to), [preset, from, to]);
}

type DashboardFilterBarProps = {
  className?: string;
};

const PO_STATUS_OPTIONS = [
  { value: "", label: "All PO statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "APPROVED", label: "Approved" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export function DashboardFilterBar({ className }: DashboardFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = useDashboardDateRange();

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", "select-options"],
    queryFn: () => fetchDepartmentSelectOptions(),
    staleTime: 60_000,
  });
  const { data: financialYears = [] } = useQuery({
    queryKey: ["financial-years"],
    queryFn: fetchFinancialYears,
    staleTime: 60_000,
  });

  const patchParams = useCallback(
    (patch: Record<string, string | undefined>) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "") sp.delete(key);
        else sp.set(key, value);
      }
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const onPresetChange = (value: string) => {
    const preset = value as DashboardDatePreset;
    const resolved = resolveDashboardRange(preset);
    patchParams({
      range: preset,
      from: preset === "custom" ? resolved.from : undefined,
      to: preset === "custom" ? resolved.to : undefined,
    });
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-card sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarRange className="h-4 w-4 shrink-0" />
        <span>
          {range.from} → {range.to}
        </span>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <FilterSelect
          aria-label="Dashboard date preset"
          value={range.preset}
          onChange={onPresetChange}
          options={[...PRESET_OPTIONS]}
          className="min-w-[160px]"
        />
        {range.preset === "custom" ? (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              aria-label="From date"
              value={searchParams.get("from") ?? range.from}
              onChange={(e) => patchParams({ from: e.target.value, range: "custom" })}
              className="w-[150px]"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              aria-label="To date"
              value={searchParams.get("to") ?? range.to}
              onChange={(e) => patchParams({ to: e.target.value, range: "custom" })}
              className="w-[150px]"
            />
          </div>
        ) : null}
        <FilterSelect
          aria-label="Department filter"
          value={searchParams.get("departmentId") ?? ""}
          onChange={(v) => patchParams({ departmentId: v || undefined })}
          options={[{ value: "", label: "All departments" }, ...departments]}
          className="min-w-[160px]"
        />
        <FilterSelect
          aria-label="Financial year filter"
          value={searchParams.get("financialYearId") ?? ""}
          onChange={(v) => patchParams({ financialYearId: v || undefined })}
          options={[
            { value: "", label: "All financial years" },
            ...financialYears.map((fy) => ({
              value: fy.financialYearId,
              label: fy.yearName,
            })),
          ]}
          className="min-w-[160px]"
        />
        <FilterSelect
          aria-label="Purchase order status filter"
          value={searchParams.get("poStatus") ?? ""}
          onChange={(v) => patchParams({ poStatus: v || undefined })}
          options={[...PO_STATUS_OPTIONS]}
          className="min-w-[140px]"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            router.replace(pathname, { scroll: false })
          }
        >
          Reset filters
        </Button>
      </div>
    </div>
  );
}

/** Client-side filter for audit timestamps until `/dashboard/summary` accepts range query params. */
export function filterRecentActivityByRange<T extends { occurredAt: string }>(
  items: T[] | undefined,
  range: DashboardDateRange,
): T[] {
  if (!items?.length) return [];
  const fromMs = new Date(`${range.from}T00:00:00`).getTime();
  const toMs = new Date(`${range.to}T23:59:59`).getTime();
  return items.filter((item) => {
    const t = new Date(item.occurredAt).getTime();
    return !Number.isNaN(t) && t >= fromMs && t <= toMs;
  });
}

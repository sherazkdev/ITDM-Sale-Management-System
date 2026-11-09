"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange, ChevronDown, SlidersHorizontal, X } from "lucide-react";

import { useQuery } from "@tanstack/react-query";

import { FilterSelect } from "@/components/common/FilterSelect";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchDepartmentSelectOptions } from "@/lib/api/departments";
import { fetchFinancialYears } from "@/lib/api/budgets";
import { fetchAssetCategories } from "@/lib/api/asset-categories";
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
    assetCategoryId: searchParams.get("assetCategoryId") ?? undefined,
    assetStatus: searchParams.get("assetStatus") ?? undefined,
  };
}

const ASSET_STATUS_OPTIONS = [
  { value: "", label: "All asset statuses" },
  { value: "IN_STOCK", label: "In stock" },
  { value: "ISSUED", label: "Issued" },
  { value: "UNDER_MAINTENANCE", label: "Under maintenance" },
  { value: "RETIRED", label: "Retired" },
] as const;

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

export function countDashboardActiveFilters(
  params: URLSearchParams,
  range: DashboardDateRange,
): number {
  return [
    params.get("departmentId"),
    params.get("financialYearId"),
    params.get("poStatus"),
    params.get("assetCategoryId"),
    params.get("assetStatus"),
    range.preset !== "current_month" ? "range" : null,
  ].filter(Boolean).length;
}

export function DashboardFilterBar({ className }: DashboardFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = useDashboardDateRange();
  const [expanded, setExpanded] = useState(true);

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
  const { data: categories = [] } = useQuery({
    queryKey: ["asset-categories"],
    queryFn: fetchAssetCategories,
    staleTime: 60_000,
  });

  const activeFilterCount = countDashboardActiveFilters(searchParams, range);

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

  const chips = useMemo(() => {
    const list: { key: string; label: string; clear: () => void }[] = [];
    const deptId = searchParams.get("departmentId");
    if (deptId) {
      const label = departments.find((d) => d.value === deptId)?.label ?? "Department";
      list.push({ key: "departmentId", label, clear: () => patchParams({ departmentId: undefined }) });
    }
    const fy = searchParams.get("financialYearId");
    if (fy) {
      const label = financialYears.find((f) => f.financialYearId === fy)?.yearName ?? "Financial year";
      list.push({ key: "financialYearId", label, clear: () => patchParams({ financialYearId: undefined }) });
    }
    const po = searchParams.get("poStatus");
    if (po) {
      const label = PO_STATUS_OPTIONS.find((o) => o.value === po)?.label ?? po;
      list.push({ key: "poStatus", label, clear: () => patchParams({ poStatus: undefined }) });
    }
    const cat = searchParams.get("assetCategoryId");
    if (cat) {
      const label = categories.find((c) => c.categoryId === cat)?.categoryName ?? "Category";
      list.push({ key: "assetCategoryId", label, clear: () => patchParams({ assetCategoryId: undefined }) });
    }
    const ast = searchParams.get("assetStatus");
    if (ast) {
      const label = ASSET_STATUS_OPTIONS.find((o) => o.value === ast)?.label ?? ast;
      list.push({ key: "assetStatus", label, clear: () => patchParams({ assetStatus: undefined }) });
    }
    if (range.preset !== "current_month") {
      const presetLabel = PRESET_OPTIONS.find((p) => p.value === range.preset)?.label ?? "Date range";
      list.push({
        key: "range",
        label: presetLabel,
        clear: () => patchParams({ range: undefined, from: undefined, to: undefined }),
      });
    }
    return list;
  }, [categories, departments, financialYears, patchParams, range.preset, searchParams]);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">Overview filters</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
              <CalendarRange className="h-3.5 w-3.5 shrink-0" />
              <span>
                Activity {range.from} → {range.to}
              </span>
              {activeFilterCount > 0 ? (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium">
                  {activeFilterCount} active
                </Badge>
              ) : null}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? "Hide" : "Show"} filters
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
            />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.replace(pathname, { scroll: false })}
          >
            Reset all
          </Button>
        </div>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <Badge
              key={chip.key}
              variant="outline"
              className="gap-1 pr-1 font-normal text-xs"
            >
              {chip.label}
              <button
                type="button"
                className="rounded p-0.5 hover:bg-muted"
                aria-label={`Clear ${chip.label} filter`}
                onClick={chip.clear}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6",
          !expanded && "hidden lg:grid",
        )}
      >
        <FilterSelect
          aria-label="Dashboard date preset"
          value={range.preset}
          onChange={onPresetChange}
          options={[...PRESET_OPTIONS]}
          className="w-full min-w-0"
        />
        {range.preset === "custom" ? (
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2 xl:col-span-2">
            <Input
              type="date"
              aria-label="From date"
              value={searchParams.get("from") ?? range.from}
              onChange={(e) => patchParams({ from: e.target.value, range: "custom" })}
              className="h-9 w-full min-w-[140px] sm:w-[150px]"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              aria-label="To date"
              value={searchParams.get("to") ?? range.to}
              onChange={(e) => patchParams({ to: e.target.value, range: "custom" })}
              className="h-9 w-full min-w-[140px] sm:w-[150px]"
            />
          </div>
        ) : null}
        <FilterSelect
          aria-label="Department filter"
          value={searchParams.get("departmentId") ?? ""}
          onChange={(v) => patchParams({ departmentId: v || undefined })}
          options={[{ value: "", label: "All departments" }, ...departments]}
          className="w-full min-w-0"
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
          className="w-full min-w-0"
        />
        <FilterSelect
          aria-label="Purchase order status filter"
          value={searchParams.get("poStatus") ?? ""}
          onChange={(v) => patchParams({ poStatus: v || undefined })}
          options={[...PO_STATUS_OPTIONS]}
          className="w-full min-w-0"
        />
        <FilterSelect
          aria-label="Asset category filter"
          value={searchParams.get("assetCategoryId") ?? ""}
          onChange={(v) => patchParams({ assetCategoryId: v || undefined })}
          options={[
            { value: "", label: "All categories" },
            ...categories.map((c) => ({ value: c.categoryId, label: c.categoryName })),
          ]}
          className="w-full min-w-0"
        />
        <FilterSelect
          aria-label="Asset status filter"
          value={searchParams.get("assetStatus") ?? ""}
          onChange={(v) => patchParams({ assetStatus: v || undefined })}
          options={[...ASSET_STATUS_OPTIONS]}
          className="w-full min-w-0"
        />
      </div>
    </div>
  );
}

/** Aligns recent-activity list with custom date range when rendering client-side. */
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

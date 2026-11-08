"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange } from "lucide-react";

import { FilterSelect } from "@/components/common/FilterSelect";
import { Input } from "@/components/ui/input";
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

export function DashboardFilterBar({ className }: DashboardFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = useDashboardDateRange();

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

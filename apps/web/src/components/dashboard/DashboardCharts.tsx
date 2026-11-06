"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCompact, formatNumber, cn } from "@/lib/utils";

export const CHART = {
  brand: "hsl(var(--chart-brand))",
  brandMuted: "hsl(var(--chart-brand-muted))",
  /** @deprecated use `brand` — kept for call sites migrating from CRM violet label */
  violet: "hsl(var(--chart-brand))",
  indigo: "hsl(212 90% 55%)",
  blue: "hsl(212 90% 55%)",
  cyan: "hsl(190 85% 48%)",
  amber: "hsl(38 92% 50%)",
  green: "hsl(152 60% 42%)",
  rose: "hsl(350 80% 62%)",
  slate: "hsl(215 16% 64%)",
} as const;

type DonutSlice = { name: string; value: number; color: string; href?: string };

export function StatusDonut({
  data,
  total,
  emptyLabel,
  size = "default",
  onSliceActivate,
}: {
  data: DonutSlice[];
  total: number;
  emptyLabel: string;
  size?: "default" | "compact";
  onSliceActivate?: (slice: DonutSlice) => void;
}) {
  if (total === 0) {
    return <div className="py-10 text-center text-sm text-muted-foreground">{emptyLabel}</div>;
  }
  const dim = size === "compact" ? "h-36 w-36" : "h-44 w-44";
  const inner = size === "compact" ? 46 : 56;
  const outer = size === "compact" ? 66 : 80;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row w-full">
      <div
        className={cn("relative shrink-0", dim)}
        role="img"
        aria-label={`Distribution chart, total ${formatNumber(total)}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={inner}
              outerRadius={outer}
              paddingAngle={2}
              stroke="none"
              style={{ cursor: onSliceActivate ? "pointer" : undefined }}
              onClick={(_, index) => {
                const slice = data[index];
                if (slice && onSliceActivate) onSliceActivate(slice);
              }}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid hsl(214 20% 90%)",
                fontSize: 12,
              }}
              formatter={(value, name) => [formatNumber(Number(value)), name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular">{formatCompact(total)}</span>
          <span className="text-xs text-muted-foreground">Total</span>
        </div>
      </div>
      <ul className="flex-1 space-y-2.5" aria-label="Legend">
        {data.map((d) => {
          const pct = Math.round((d.value / total) * 100);
          const interactive = Boolean(onSliceActivate || d.href);
          const content = (
            <>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="flex-1 text-muted-foreground">{d.name}</span>
              <span className="font-medium tabular">{formatNumber(d.value)}</span>
              <span className="w-10 text-right text-xs text-muted-foreground tabular">{pct}%</span>
            </>
          );
          return (
            <li key={d.name}>
              {interactive ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md text-sm hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring px-1 py-0.5 text-left"
                  onClick={() => onSliceActivate?.(d)}
                >
                  {content}
                </button>
              ) : (
                <div className="flex items-center gap-2 text-sm">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function HorizontalBarList({
  rows,
  emptyLabel,
  onRowActivate,
}: {
  rows: Array<{ label: string; value: number; color: string; href?: string }>;
  emptyLabel: string;
  onRowActivate?: (row: { label: string; value: number; color: string; href?: string }) => void;
}) {
  const max = Math.max(...rows.map((r) => r.value), 0);
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (max === 0) {
    return <div className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</div>;
  }
  return (
    <div className="flex flex-col gap-4" role="list">
      {rows.map((row) => {
        const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
        const interactive = Boolean(onRowActivate || row.href);
        const body = (
          <>
            <span className="w-24 shrink-0 truncate text-sm text-muted-foreground">{row.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(6, Math.round((row.value / max) * 100))}%`,
                  backgroundColor: row.color,
                }}
              />
            </div>
            <span className="w-10 text-right text-sm font-medium tabular">{formatCompact(row.value)}</span>
            <span className="w-10 text-right text-xs text-muted-foreground tabular">{pct}%</span>
          </>
        );
        if (interactive) {
          return (
            <button
              key={row.label}
              type="button"
              role="listitem"
              className="flex w-full items-center gap-3 rounded-md px-1 py-0.5 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onRowActivate?.(row)}
            >
              {body}
            </button>
          );
        }
        return (
          <div key={row.label} className="flex items-center gap-3" role="listitem">
            {body}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { KpiCard } from "@/components/common/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

export type ListKpiItem = {
  key: string;
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "violet" | "green" | "blue" | "amber" | "rose" | "neutral";
};

type ListPageKpiBandProps = {
  items: ListKpiItem[];
  loading?: boolean;
  /** Desktop columns — CRM list pages often use 4 */
  columns?: 3 | 4 | 5;
  density?: "default" | "compact";
};

const COL_CLASS: Record<NonNullable<ListPageKpiBandProps["columns"]>, string> = {
  3: "sm:grid-cols-2 xl:grid-cols-3",
  4: "sm:grid-cols-2 xl:grid-cols-4",
  5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
};

/**
 * CRM-style KPI row above list tables. Values must come from API meta/summary — not page rows.
 */
export function ListPageKpiBand({ items, loading, columns = 4, density = "default" }: ListPageKpiBandProps) {
  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <div className={`grid grid-cols-1 gap-4 ${COL_CLASS[columns]}`}>
      {loading
        ? Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-[92px] rounded-xl" />
          ))
        : items.map((item) => (
            <KpiCard
              key={item.key}
              label={item.label}
              value={item.value}
              icon={item.icon}
              tone={item.tone ?? "violet"}
              density={density}
            />
          ))}
    </div>
  );
}

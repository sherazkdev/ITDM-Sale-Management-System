"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { FilterSelect } from "@/components/common/FilterSelect";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  NOTIFICATION_EVENT_OPTIONS,
  countNotificationActiveFilters,
  type NotificationReadFilter,
} from "@/lib/api/notifications";
import { cn } from "@/lib/utils";

const READ_OPTIONS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
] as const;

export function useNotificationFilterParams() {
  const sp = useSearchParams();
  return {
    read: (sp.get("read") as NotificationReadFilter) || "all",
    expiringSoon: sp.get("expiringSoon") === "true",
    eventType: sp.get("eventType") ?? "",
    search: sp.get("search") ?? "",
    dueFrom: sp.get("dueFrom") ?? "",
    dueTo: sp.get("dueTo") ?? "",
  };
}

type Props = { className?: string };

export function NotificationFilterBar({ className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useNotificationFilterParams();

  const activeCount = countNotificationActiveFilters(searchParams);

  const patch = useCallback(
    (patch: Record<string, string | undefined>) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "") sp.delete(key);
        else sp.set(key, value);
      }
      sp.delete("page");
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const chips = useMemo(() => {
    const list: { key: string; label: string; clear: () => void }[] = [];
    if (filters.read !== "all") {
      list.push({
        key: "read",
        label: READ_OPTIONS.find((o) => o.value === filters.read)?.label ?? filters.read,
        clear: () => patch({ read: undefined }),
      });
    }
    if (filters.expiringSoon) {
      list.push({ key: "expiringSoon", label: "Expiring soon", clear: () => patch({ expiringSoon: undefined }) });
    }
    if (filters.eventType) {
      const label =
        NOTIFICATION_EVENT_OPTIONS.find((o) => o.value === filters.eventType)?.label ?? filters.eventType;
      list.push({ key: "eventType", label, clear: () => patch({ eventType: undefined }) });
    }
    if (filters.search) {
      list.push({ key: "search", label: `“${filters.search}”`, clear: () => patch({ search: undefined }) });
    }
    if (filters.dueFrom || filters.dueTo) {
      list.push({
        key: "due",
        label: `${filters.dueFrom || "…"} → ${filters.dueTo || "…"}`,
        clear: () => patch({ dueFrom: undefined, dueTo: undefined }),
      });
    }
    return list;
  }, [filters, patch]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <div>
            <p className="text-sm font-medium">Filter notifications</p>
            {activeCount > 0 ? (
              <p className="text-xs text-muted-foreground">{activeCount} filter{activeCount === 1 ? "" : "s"} active</p>
            ) : (
              <p className="text-xs text-muted-foreground">All inbox items</p>
            )}
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => router.replace(pathname, { scroll: false })}>
          Reset filters
        </Button>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <Badge key={c.key} variant="outline" className="gap-1 pr-1 text-xs font-normal">
              {c.label}
              <button
                type="button"
                className="rounded p-0.5 hover:bg-muted"
                aria-label={`Clear ${c.label}`}
                onClick={c.clear}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <FilterSelect
          aria-label="Read state"
          value={filters.read}
          onChange={(v) => patch({ read: v === "all" ? undefined : v })}
          options={[...READ_OPTIONS]}
          className="w-full"
          searchable={false}
        />
        <FilterSelect
          aria-label="Expiring soon"
          value={filters.expiringSoon ? "soon" : ""}
          onChange={(v) => patch({ expiringSoon: v === "soon" ? "true" : undefined })}
          options={[
            { value: "", label: "Any due date" },
            { value: "soon", label: "Expiring soon" },
          ]}
          className="w-full"
          searchable={false}
        />
        <FilterSelect
          aria-label="Category"
          value={filters.eventType}
          onChange={(v) => patch({ eventType: v || undefined })}
          options={[...NOTIFICATION_EVENT_OPTIONS]}
          className="w-full"
        />
        <div className="relative sm:col-span-2">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            defaultValue={filters.search}
            key={filters.search}
            placeholder="Search type, entity…"
            className="pl-8 h-9"
            aria-label="Search notifications"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                patch({ search: (e.target as HTMLInputElement).value || undefined });
              }
            }}
            onBlur={(e) => {
              const next = e.target.value.trim();
              if (next !== (filters.search ?? "")) patch({ search: next || undefined });
            }}
          />
        </div>
        <Input
          type="date"
          aria-label="Due from"
          value={filters.dueFrom}
          onChange={(e) => patch({ dueFrom: e.target.value || undefined })}
          className="h-9"
        />
        <Input
          type="date"
          aria-label="Due to"
          value={filters.dueTo}
          onChange={(e) => patch({ dueTo: e.target.value || undefined })}
          className="h-9"
        />
      </div>
    </div>
  );
}

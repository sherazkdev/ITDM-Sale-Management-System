"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type ListUrlDefaults = {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
} & Record<string, string | number | undefined>;

function parsePositiveInt(raw: string | null, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : fallback;
}

/**
 * Persist list filters in the URL for shareable bookmarkable views.
 */
export function useListUrlState(defaults: ListUrlDefaults = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = useMemo(() => {
    const page = parsePositiveInt(searchParams.get("page"), defaults.page ?? 1);
    const pageSize = parsePositiveInt(searchParams.get("pageSize"), defaults.pageSize ?? 20);
    const search = searchParams.get("search") ?? defaults.search ?? "";
    const sortBy = searchParams.get("sortBy") ?? defaults.sortBy ?? "";
    const sortDirRaw = searchParams.get("sortDir");
    const sortDir = (
      sortDirRaw === "desc" ? "desc" : sortDirRaw === "asc" ? "asc" : (defaults.sortDir ?? "asc")
    ) as "asc" | "desc";
    const extras: Record<string, string> = {};
    for (const key of Object.keys(defaults)) {
      if (["page", "pageSize", "search", "sortBy", "sortDir"].includes(key)) continue;
      const v = searchParams.get(key);
      if (v !== null) extras[key] = v;
      else if (typeof defaults[key] === "string") extras[key] = defaults[key] as string;
    }
    return { page, pageSize, search, sortBy, sortDir, extras };
  }, [searchParams, defaults]);

  type ListUrlPatch = {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    extras?: Record<string, string | undefined>;
  };

  const patch = useCallback(
    (patch: ListUrlPatch) => {
      const sp = new URLSearchParams(searchParams.toString());
      const apply = (key: string, value: string | number | undefined | null) => {
        if (value === undefined || value === null || value === "") sp.delete(key);
        else sp.set(key, String(value));
      };
      if (patch.page !== undefined) apply("page", patch.page);
      if (patch.pageSize !== undefined) apply("pageSize", patch.pageSize);
      if (patch.search !== undefined) apply("search", patch.search);
      if (patch.sortBy !== undefined) apply("sortBy", patch.sortBy);
      if (patch.sortDir !== undefined) apply("sortDir", patch.sortDir);
      if ("extras" in patch && patch.extras) {
        for (const [k, v] of Object.entries(patch.extras)) apply(k, v ?? "");
      }
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { ...state, patch };
}

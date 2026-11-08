"use client";

import { useMemo, useCallback } from "react";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useListUrlState, type ListUrlDefaults } from "@/lib/hooks/use-list-url-state";

export function useServerListTable(options: { defaults?: ListUrlDefaults; defaultSortBy?: string } = {}) {
  const list = useListUrlState(options.defaults ?? {});
  const debouncedSearch = useDebouncedValue(list.search, 300);

  const serverSort = useMemo(
    () => ({
      sortBy: list.sortBy || options.defaultSortBy || "",
      sortDir: list.sortDir,
    }),
    [list.sortBy, list.sortDir, options.defaultSortBy],
  );

  const onServerSortChange = useCallback(
    (sortBy: string | null, sortDir: "asc" | "desc" | null) => {
      list.patch({
        sortBy: sortBy ?? "",
        sortDir: sortDir ?? "asc",
        page: 1,
      });
    },
    [list],
  );

  return {
    page: list.page,
    pageSize: list.pageSize,
    search: list.search,
    debouncedSearch,
    sortBy: list.sortBy,
    sortDir: list.sortDir,
    extras: list.extras,
    patch: list.patch,
    serverSort,
    onServerSortChange,
  };
}

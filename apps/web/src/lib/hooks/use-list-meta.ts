import { useQuery } from "@tanstack/react-query";

type PaginatedResult = { meta: { total: number } };

type PaginatedFetcher = (params: {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
}) => Promise<PaginatedResult>;

/** Server-side totals via `meta.total` (pageSize 1) — not derived from visible rows. */
export function useListMetaTotals(
  queryKeyPrefix: string[],
  fetcher: PaginatedFetcher,
  options?: { includeActive?: boolean; includeInactive?: boolean },
) {
  const includeActive = options?.includeActive !== false;
  const includeInactive = options?.includeInactive === true;

  const all = useQuery({
    queryKey: [...queryKeyPrefix, "meta", "all"],
    queryFn: () => fetcher({ page: 1, pageSize: 1 }),
    select: (r) => r.meta.total,
  });

  const active = useQuery({
    queryKey: [...queryKeyPrefix, "meta", "active"],
    queryFn: () => fetcher({ page: 1, pageSize: 1, isActive: true }),
    select: (r) => r.meta.total,
    enabled: includeActive,
  });

  const inactive = useQuery({
    queryKey: [...queryKeyPrefix, "meta", "inactive"],
    queryFn: () => fetcher({ page: 1, pageSize: 1, isActive: false }),
    select: (r) => r.meta.total,
    enabled: includeInactive,
  });

  return {
    total: all.data,
    active: includeActive ? active.data : undefined,
    inactive: includeInactive ? inactive.data : undefined,
    isLoading: all.isLoading || active.isLoading || inactive.isLoading,
  };
}

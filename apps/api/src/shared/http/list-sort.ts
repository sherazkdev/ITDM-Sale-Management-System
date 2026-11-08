import type { PaginationQuery } from "./pagination.schema.js";

type OrderBy = Record<string, "asc" | "desc">;

/**
 * Whitelist-based Prisma orderBy for paginated list endpoints.
 */
export function resolveListOrderBy(
  allowedFields: readonly string[],
  query: Pick<PaginationQuery, "sortBy" | "sortDir">,
  fallback: OrderBy,
): OrderBy {
  const field = query.sortBy?.trim();
  if (field && allowedFields.includes(field)) {
    return { [field]: query.sortDir };
  }
  return fallback;
}

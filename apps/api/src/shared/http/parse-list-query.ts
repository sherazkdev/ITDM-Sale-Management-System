import type { Request } from "express";
import type { PaginationQuery } from "./pagination.schema.js";

export function parseListPagination(req: Request, defaults?: Partial<PaginationQuery>): PaginationQuery {
  const page = Number(req.query.page ?? defaults?.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? defaults?.pageSize ?? 20);
  const sortBy = typeof req.query.sortBy === "string" ? req.query.sortBy : defaults?.sortBy;
  const sortDir = req.query.sortDir === "desc" ? "desc" : (defaults?.sortDir ?? "asc");
  return {
    page: Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1,
    pageSize: Number.isFinite(pageSize) && pageSize >= 1 ? Math.min(100, Math.floor(pageSize)) : 20,
    sortBy,
    sortDir,
  };
}

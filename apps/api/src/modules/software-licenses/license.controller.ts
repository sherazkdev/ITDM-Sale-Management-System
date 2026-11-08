import type { Request, Response } from "express";
import type { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { paginationMeta } from "../../shared/http/pagination.schema.js";
import { parseListPagination } from "../../shared/http/parse-list-query.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import { createLicenseSchema, updateLicenseSchema } from "./license.schema.js";
import type { LicenseService } from "./license.service.js";

type CreateBody = z.infer<typeof createLicenseSchema>;
type UpdateBody = z.infer<typeof updateLicenseSchema>;

function parseId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid id", 400);
  }
  return BigInt(raw);
}

function canViewSecrets(req: Request): boolean {
  return req.principal?.permissions.has(PermissionKeys.licensesManage) === true;
}

export class LicenseController {
  constructor(private readonly service: LicenseService) {}

  create = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.create(req.body as CreateBody, {
      actorUserId: req.principal?.userId,
      requestId: getRequestId(req),
    }, canViewSecrets(req));
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) }, 201);
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const pagination = parseListPagination(req, { sortDir: "asc" });
    const before = typeof req.query.before === "string" ? req.query.before : undefined;
    const result = await this.service.list(pagination, { expiringBefore: before }, canViewSecrets(req));
    sendSuccess(res, toPublicJson(result.items), {
      requestId: getRequestId(req),
      ...paginationMeta(pagination.page, pagination.pageSize, result.total),
    });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.getById(parseId(String(req.params.id)), canViewSecrets(req));
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.update(
      parseId(String(req.params.id)),
      req.body as UpdateBody,
      { actorUserId: req.principal?.userId, requestId: getRequestId(req) },
      canViewSecrets(req),
    );
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });

  renew = asyncHandler((_req: Request, _res: Response) => {
    this.service.renewBlocked();
  });
}

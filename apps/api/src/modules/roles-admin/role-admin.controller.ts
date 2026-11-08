import type { Request, Response } from "express";
import type { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import {
  createRoleSchema,
  setRolePermissionsSchema,
  updateRoleSchema,
} from "./role-admin.schema.js";
import type { RoleAdminService } from "./role-admin.service.js";

type CreateBody = z.infer<typeof createRoleSchema>;
type UpdateBody = z.infer<typeof updateRoleSchema>;
type PermissionsBody = z.infer<typeof setRolePermissionsSchema>;

function parseRoleId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid role id", 400);
  return BigInt(raw);
}

export class RoleAdminController {
  constructor(private readonly service: RoleAdminService) {}

  listRoles = asyncHandler(async (req: Request, res: Response) => {
    const rows = await this.service.listRoles();
    sendSuccess(res, toPublicJson(rows), { requestId: getRequestId(req) });
  });

  listPermissions = asyncHandler(async (req: Request, res: Response) => {
    const rows = await this.service.listPermissions();
    sendSuccess(res, toPublicJson(rows), { requestId: getRequestId(req) });
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.createRole(req.body as CreateBody, req.principal?.userId, getRequestId(req));
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) }, 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.updateRole(
      parseRoleId(String(req.params.id)),
      req.body as UpdateBody,
      req.principal?.userId,
      getRequestId(req),
    );
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });

  setPermissions = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as PermissionsBody;
    const row = await this.service.setRolePermissions(
      parseRoleId(String(req.params.id)),
      body.permissionKeys,
      req.principal?.userId,
      getRequestId(req),
    );
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.service.deleteRole(
      parseRoleId(String(req.params.id)),
      req.principal?.userId,
      getRequestId(req),
    );
    sendSuccess(res, data, { requestId: getRequestId(req) });
  });
}

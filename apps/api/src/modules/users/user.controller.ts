import type { Request, Response } from "express";
import type { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import { createUserSchema, setUserRolesSchema, updateUserSchema } from "./user.schema.js";
import type { UserAdminService } from "./user.service.js";

type CreateBody = z.infer<typeof createUserSchema>;
type UpdateBody = z.infer<typeof updateUserSchema>;
type RolesBody = z.infer<typeof setUserRolesSchema>;

function parseUserId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid user id", 400);
  }
  return BigInt(raw);
}

function stripUser<T extends { passwordHash?: string }>(user: T) {
  const { passwordHash: _p, ...rest } = user;
  return rest;
}

export class UserAdminController {
  constructor(private readonly service: UserAdminService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const rows = await this.service.list();
    sendSuccess(
      res,
      toPublicJson(rows.map((u) => stripUser(u))),
      { requestId: getRequestId(req) },
    );
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.create(req.body as CreateBody);
    sendSuccess(res, toPublicJson(stripUser(row)), { requestId: getRequestId(req) }, 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.update(parseUserId(String(req.params.id)), req.body as UpdateBody);
    sendSuccess(res, toPublicJson(stripUser(row)), { requestId: getRequestId(req) });
  });

  setRoles = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.setRoles(parseUserId(String(req.params.id)), (req.body as RolesBody).roleKeys);
    sendSuccess(res, toPublicJson(stripUser(row)), { requestId: getRequestId(req) });
  });

  listRoles = asyncHandler(async (req: Request, res: Response) => {
    const rows = await this.service.listRoles();
    sendSuccess(res, toPublicJson(rows), { requestId: getRequestId(req) });
  });
}

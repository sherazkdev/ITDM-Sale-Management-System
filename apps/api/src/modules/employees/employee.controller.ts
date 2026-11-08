import type { Request, Response } from "express";
import type { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { paginationMeta } from "../../shared/http/pagination.schema.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import { createEmployeeSchema, updateEmployeeSchema } from "./employee.schema.js";
import type { EmployeeService } from "./employee.service.js";

type CreateEmployeeBody = z.infer<typeof createEmployeeSchema>;
type UpdateEmployeeBody = z.infer<typeof updateEmployeeSchema>;

function parseEmployeeId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid employee id", 400);
  }
  return BigInt(raw);
}

export class EmployeeController {
  constructor(private readonly service: EmployeeService) {}

  create = asyncHandler(async (req: Request, res: Response) => {
    const employee = await this.service.create(req.body as CreateEmployeeBody);
    sendSuccess(res, toPublicJson(employee), { requestId: getRequestId(req) }, 201);
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const sortBy = typeof req.query.sortBy === "string" ? req.query.sortBy : undefined;
    const sortDir = req.query.sortDir === "desc" ? "desc" : "asc";
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const isActive =
      req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined;
    const result = await this.service.list(
      { page, pageSize, sortBy, sortDir },
      { search, isActive },
    );
    sendSuccess(res, toPublicJson(result.items), {
      requestId: getRequestId(req),
      ...paginationMeta(page, pageSize, result.total),
    });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const employee = await this.service.getById(parseEmployeeId(String(req.params.id)));
    if (!employee) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Employee not found", 404);
    }
    sendSuccess(res, toPublicJson(employee), { requestId: getRequestId(req) });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const employee = await this.service.update(
      parseEmployeeId(String(req.params.id)),
      req.body as UpdateEmployeeBody,
    );
    sendSuccess(res, toPublicJson(employee), { requestId: getRequestId(req) });
  });

  deactivate = asyncHandler(async (req: Request, res: Response) => {
    const employee = await this.service.deactivate(parseEmployeeId(String(req.params.id)));
    sendSuccess(res, toPublicJson(employee), { requestId: getRequestId(req) });
  });
}

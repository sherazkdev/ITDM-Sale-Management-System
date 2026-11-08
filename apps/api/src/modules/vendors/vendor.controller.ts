import type { Request, Response } from "express";
import type { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { paginationMeta } from "../../shared/http/pagination.schema.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import { createVendorSchema, updateVendorSchema } from "./vendor.schema.js";
import type { VendorService } from "./vendor.service.js";

type CreateVendorBody = z.infer<typeof createVendorSchema>;
type UpdateVendorBody = z.infer<typeof updateVendorSchema>;

function parseVendorId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid vendor id", 400);
  }
  return BigInt(raw);
}

export class VendorController {
  constructor(private readonly service: VendorService) {}

  create = asyncHandler(async (req: Request, res: Response) => {
    const vendor = await this.service.create(req.body as CreateVendorBody);
    sendSuccess(res, toPublicJson(vendor), { requestId: getRequestId(req) }, 201);
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const isActive =
      req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined;
    const result = await this.service.list(
      {
        page,
        pageSize,
        sortBy: typeof req.query.sortBy === "string" ? req.query.sortBy : undefined,
        sortDir: req.query.sortDir === "desc" ? "desc" : "asc",
      },
      { search, isActive },
    );
    sendSuccess(res, toPublicJson(result.items), {
      requestId: getRequestId(req),
      ...paginationMeta(page, pageSize, result.total),
    });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const vendor = await this.service.getById(parseVendorId(String(req.params.id)));
    sendSuccess(res, toPublicJson(vendor), { requestId: getRequestId(req) });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const vendor = await this.service.update(
      parseVendorId(String(req.params.id)),
      req.body as UpdateVendorBody,
    );
    sendSuccess(res, toPublicJson(vendor), { requestId: getRequestId(req) });
  });

  archive = asyncHandler(async (req: Request, res: Response) => {
    const vendor = await this.service.archive(parseVendorId(String(req.params.id)));
    sendSuccess(res, toPublicJson(vendor), { requestId: getRequestId(req) });
  });
}

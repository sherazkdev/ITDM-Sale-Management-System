import type { Request, Response } from "express";
import type { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { paginationMeta } from "../../shared/http/pagination.schema.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import { createContractSchema, updateContractSchema } from "./contract.schema.js";
import type { ContractService } from "./contract.service.js";

type CreateBody = z.infer<typeof createContractSchema>;
type UpdateBody = z.infer<typeof updateContractSchema>;

function parseId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid contract id", 400);
  }
  return BigInt(raw);
}

export class ContractController {
  constructor(private readonly service: ContractService) {}

  create = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.create(req.body as CreateBody, {
      actorUserId: req.principal?.userId,
      requestId: getRequestId(req),
    });
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) }, 201);
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const vendorId =
      typeof req.query.vendorId === "string" && /^\d+$/.test(req.query.vendorId)
        ? BigInt(req.query.vendorId)
        : undefined;
    const expiringBefore =
      typeof req.query.before === "string" ? req.query.before : undefined;
    const result = await this.service.list(
      { page, pageSize, sortDir: "asc" },
      { vendorId, expiringBefore },
    );
    sendSuccess(res, toPublicJson(result.items), {
      requestId: getRequestId(req),
      ...paginationMeta(page, pageSize, result.total),
    });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.getById(parseId(String(req.params.id)));
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.update(parseId(String(req.params.id)), req.body as UpdateBody, {
      actorUserId: req.principal?.userId,
      requestId: getRequestId(req),
    });
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });

  listPurchaseOrders = asyncHandler(async (req: Request, res: Response) => {
    const rows = await this.service.listPurchaseOrders(parseId(String(req.params.id)));
    sendSuccess(res, toPublicJson(rows), { requestId: getRequestId(req) });
  });
}

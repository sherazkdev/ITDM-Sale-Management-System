import type { Request, Response } from "express";
import type { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import {
  appendLedgerEntrySchema,
  createBudgetAllocationSchema,
  createFinancialYearSchema,
} from "./budget.schema.js";
import type { BudgetService } from "./budget.service.js";

type YearBody = z.infer<typeof createFinancialYearSchema>;
type AllocationBody = z.infer<typeof createBudgetAllocationSchema>;
type LedgerBody = z.infer<typeof appendLedgerEntrySchema>;

function parseId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid id", 400);
  }
  return BigInt(raw);
}

export class BudgetController {
  constructor(private readonly service: BudgetService) {}

  createYear = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.createFinancialYear(req.body as YearBody);
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) }, 201);
  });

  listYears = asyncHandler(async (req: Request, res: Response) => {
    const rows = await this.service.listFinancialYears();
    sendSuccess(res, toPublicJson(rows), { requestId: getRequestId(req) });
  });

  createAllocation = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.createAllocation(req.body as AllocationBody);
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) }, 201);
  });

  listAllocations = asyncHandler(async (req: Request, res: Response) => {
    const financialYearId =
      typeof req.query.financialYearId === "string" && /^\d+$/.test(req.query.financialYearId)
        ? BigInt(req.query.financialYearId)
        : undefined;
    const rows = await this.service.listAllocations(financialYearId);
    sendSuccess(res, toPublicJson(rows), { requestId: getRequestId(req) });
  });

  appendLedger = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.appendLedgerEntry(req.body as LedgerBody, {
      actorUserId: req.principal?.userId,
      requestId: getRequestId(req),
    });
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) }, 201);
  });

  correctAllocation = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.correctAllocation(
      parseId(String(req.params.budgetId)),
      req.body as {
        correctionReason: string;
        budgetCategory?: string;
        allocatedAmount?: number;
      },
      {
        actorUserId: req.principal?.userId,
        requestId: getRequestId(req),
      },
    );
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });

  summary = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.getSummary(parseId(String(req.params.budgetId)));
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });

  byPurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.getUsageByPurchaseOrder(parseId(String(req.params.id)));
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });

  byVendor = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.getUsageByVendor(parseId(String(req.params.id)));
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });
}

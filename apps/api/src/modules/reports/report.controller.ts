import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import type { ReportService } from "./report.service.js";

function formatParam(req: Request): string {
  const formatRaw = req.query.format;
  return typeof formatRaw === "string" ? formatRaw : "json";
}

function sendReport(req: Request, res: Response, data: unknown, format: string) {
  if (format === "csv") {
    const csv = data as { body: string };
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("X-ITDMS-Export-Disclaimer", "NON-OFFICIAL-D12");
    res.send(csv.body);
    return;
  }
  if (format === "pdf") {
    const pdf = data as { body: Buffer };
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-ITDMS-Export-Disclaimer", "NON-OFFICIAL-D12");
    res.send(pdf.body);
    return;
  }
  if (format === "xlsx") {
    const x = data as { body: Buffer };
    res.setHeader("Content-Type", "application/vnd.ms-excel");
    res.setHeader("X-ITDMS-Export-Disclaimer", "NON-OFFICIAL-D12");
    res.send(x.body);
    return;
  }
  sendSuccess(res, toPublicJson(data), { requestId: getRequestId(req) });
}

export class ReportController {
  constructor(private readonly service: ReportService) {}

  inventory = asyncHandler(async (req: Request, res: Response) => {
    const format = this.service.parseFormat(formatParam(req));
    const data = await this.service.inventory(format);
    await this.service.logExport(req.principal?.userId, "inventory", getRequestId(req));
    sendReport(req, res, data, format);
  });

  assetRegister = asyncHandler(async (req: Request, res: Response) => {
    const format = this.service.parseFormat(formatParam(req));
    const data = await this.service.assetRegister(format);
    await this.service.logExport(req.principal?.userId, "asset-register", getRequestId(req));
    sendReport(req, res, data, format);
  });

  budgetUtilization = asyncHandler(async (req: Request, res: Response) => {
    const format = this.service.parseFormat(formatParam(req));
    const financialYearId =
      typeof req.query.financialYearId === "string" && /^\d+$/.test(req.query.financialYearId)
        ? BigInt(req.query.financialYearId)
        : undefined;
    const data = await this.service.budgetUtilization(financialYearId, format);
    await this.service.logExport(req.principal?.userId, "budget-utilization", getRequestId(req));
    sendReport(req, res, data, format);
  });

  purchaseOrders = asyncHandler(async (req: Request, res: Response) => {
    const format = this.service.parseFormat(formatParam(req));
    const data = await this.service.purchaseOrders(format);
    await this.service.logExport(req.principal?.userId, "purchase-orders", getRequestId(req));
    sendReport(req, res, data, format);
  });

  contracts = asyncHandler(async (req: Request, res: Response) => {
    const format = this.service.parseFormat(formatParam(req));
    const data = await this.service.contracts(format);
    await this.service.logExport(req.principal?.userId, "contracts", getRequestId(req));
    sendReport(req, res, data, format);
  });

  invoices = asyncHandler(async (req: Request, res: Response) => {
    const format = this.service.parseFormat(formatParam(req));
    const data = await this.service.invoices(format);
    await this.service.logExport(req.principal?.userId, "invoices", getRequestId(req));
    sendReport(req, res, data, format);
  });
}

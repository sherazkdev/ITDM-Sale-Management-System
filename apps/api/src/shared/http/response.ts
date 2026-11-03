import type { Response } from "express";

export type SuccessMeta = {
  requestId: string;
  page?: number;
  pageSize?: number;
  total?: number;
};

export function sendSuccess<T>(
  res: Response,
  data: T,
  meta: SuccessMeta,
  statusCode = 200,
): void {
  res.status(statusCode).json({
    success: true,
    data,
    meta,
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  requestId: string,
  details: unknown = null,
): void {
  res.status(statusCode).json({
    success: false,
    error: { code, message, details },
    meta: { requestId },
  });
}

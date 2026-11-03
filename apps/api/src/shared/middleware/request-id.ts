import { randomUUID } from "node:crypto";
import type { Request, RequestHandler } from "express";

export const REQUEST_ID_HEADER = "x-request-id";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestIdMiddleware(): RequestHandler {
  return (req, res, next) => {
    const incoming = req.header(REQUEST_ID_HEADER);
    const requestId =
      typeof incoming === "string" && incoming.trim().length > 0
        ? incoming.trim().slice(0, 128)
        : randomUUID();
    req.requestId = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  };
}

export function getRequestId(req: Request): string {
  return req.requestId;
}

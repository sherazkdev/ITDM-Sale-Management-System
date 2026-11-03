import type { ErrorRequestHandler, RequestHandler } from "express";
import { isAppError } from "../errors/app-error.js";
import { ErrorCodes } from "../errors/error-codes.js";
import { sendError } from "../http/response.js";
import { getRequestId } from "./request-id.js";
import type { Logger } from "../logging/logger.js";

export function notFoundHandler(): RequestHandler {
  return (req, res) => {
    sendError(
      res,
      404,
      ErrorCodes.NOT_FOUND,
      "Resource not found",
      getRequestId(req),
    );
  };
}

export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (err, req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }

    const requestId = getRequestId(req);

    if (err instanceof SyntaxError && "body" in err) {
      sendError(res, 400, ErrorCodes.BAD_REQUEST, "Invalid JSON body", requestId);
      return;
    }

    if (isAppError(err)) {
      if (!err.isOperational) {
        logger.error({ err, requestId }, "Non-operational application error");
      }
      sendError(res, err.statusCode, err.code, err.message, requestId, err.details);
      return;
    }

    logger.error({ err: err as Error, requestId }, "Unhandled error");
    sendError(
      res,
      500,
      ErrorCodes.INTERNAL_ERROR,
      "An unexpected error occurred",
      requestId,
    );
  };
}

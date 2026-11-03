import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../errors/app-error.js";
import { ErrorCodes } from "../errors/error-codes.js";

export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        new AppError(ErrorCodes.VALIDATION_ERROR, "Request body validation failed", 422, {
          details: result.error.flatten(),
        }),
      );
      return;
    }
    req.body = result.data;
    next();
  };
}

import type { RequestHandler } from "express";
import type { AuthService } from "../../modules/auth/auth.service.js";
import { loadEnv } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { ErrorCodes } from "../errors/error-codes.js";
import { asyncHandler } from "../http/async-handler.js";

export function createAuthenticate(authService: AuthService): RequestHandler {
  const cookieName = loadEnv().SESSION_COOKIE_NAME;
  return asyncHandler(async (req, _res, next) => {
    const header = req.header("authorization");
    const bearer = header?.startsWith("Bearer ") ? header.slice(7).trim() : undefined;
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const cookieToken = typeof cookies?.[cookieName] === "string" ? cookies[cookieName] : undefined;
    const token = bearer || cookieToken;
    if (!token) {
      next(new AppError(ErrorCodes.UNAUTHORIZED, "Authentication required", 401));
      return;
    }
    const principal = await authService.resolvePrincipalFromToken(token);
    if (!principal) {
      next(new AppError(ErrorCodes.UNAUTHORIZED, "Authentication required", 401));
      return;
    }
    req.principal = principal;
    next();
  });
}

export function requirePermission(permission: string): RequestHandler {
  return (req, _res, next) => {
    const principal = req.principal;
    if (!principal) {
      next(new AppError(ErrorCodes.UNAUTHORIZED, "Authentication required", 401));
      return;
    }
    if (!principal.permissions.has(permission)) {
      next(new AppError(ErrorCodes.FORBIDDEN, "Forbidden", 403));
      return;
    }
    next();
  };
}

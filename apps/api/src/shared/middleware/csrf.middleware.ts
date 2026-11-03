import type { Request, RequestHandler } from "express";
import { loadEnv } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { ErrorCodes } from "../errors/error-codes.js";

/** Must match `apps/web/src/lib/api/client.ts` */
export const CSRF_HEADER_NAME = "x-itdms-requested-with";
export const CSRF_HEADER_VALUE = "itdms";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Explicit opt-out for local debugging only — never set in production. */
export function isCsrfProtectionDisabled(): boolean {
  return process.env.ITDMS_DISABLE_CSRF === "1";
}

/** POST /api/v1/auth/login — no session cookie yet. */
function isLoginRequest(req: { method: string; originalUrl: string }): boolean {
  return req.method.toUpperCase() === "POST" && req.originalUrl.startsWith("/api/v1/auth/login");
}

/** Reject when Origin is present and does not match Host or configured CORS_ORIGIN. */
export function isCrossOriginMutation(req: Request): boolean {
  const origin = req.header("Origin");
  if (!origin) {
    return false;
  }
  const env = loadEnv();
  if (env.CORS_ORIGIN && origin === env.CORS_ORIGIN) {
    return false;
  }
  const host = req.header("Host");
  if (host) {
    try {
      const parsed = new URL(origin);
      if (parsed.host === host) {
        return false;
      }
    } catch {
      return true;
    }
  }
  return true;
}

export type CsrfProtectionOptions = {
  disabled?: boolean;
};

export function createCsrfProtection(options: CsrfProtectionOptions = {}): RequestHandler {
  const disabled = options.disabled ?? isCsrfProtectionDisabled();
  const cookieName = loadEnv().SESSION_COOKIE_NAME;

  return (req, _res, next) => {
    if (disabled) {
      next();
      return;
    }
    if (SAFE_METHODS.has(req.method.toUpperCase())) {
      next();
      return;
    }
    if (isLoginRequest(req)) {
      next();
      return;
    }

    const bearer = req.header("authorization");
    const usesBearer = bearer?.startsWith("Bearer ") === true;

    const cookies = req.cookies as Record<string, unknown> | undefined;
    const hasSessionCookie = typeof cookies?.[cookieName] === "string";

    if (hasSessionCookie) {
      if (isCrossOriginMutation(req)) {
        next(new AppError(ErrorCodes.FORBIDDEN, "Cross-origin request rejected", 403));
        return;
      }
      if (req.header(CSRF_HEADER_NAME) !== CSRF_HEADER_VALUE) {
        next(new AppError(ErrorCodes.FORBIDDEN, "CSRF validation failed", 403));
        return;
      }
      next();
      return;
    }

    if (usesBearer) {
      next();
      return;
    }

    next();
  };
}

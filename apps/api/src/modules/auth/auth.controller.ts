import type { Request, Response } from "express";
import type { z } from "zod";
import type { AppEnv } from "../../shared/config/env.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import { loginBodySchema } from "./auth.schema.js";
import type { AuthService } from "./auth.service.js";
import { sessionCookieOptions } from "../../shared/auth/session-cookie.js";

type LoginBody = z.infer<typeof loginBodySchema>;

export class AuthController {
  constructor(
    private readonly service: AuthService,
    private readonly env: AppEnv,
  ) {}

  login = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as LoginBody;
    const result = await this.service.login({
      username: body.username,
      password: body.password,
      ipAddress: req.ip,
      userAgent: req.header("user-agent") ?? undefined,
    });
    res.cookie(this.env.SESSION_COOKIE_NAME, result.token, sessionCookieOptions(this.env, result.expiresAt));
    sendSuccess(res, toPublicJson(result.user), { requestId: getRequestId(req) });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const cookieValue = cookies?.[this.env.SESSION_COOKIE_NAME];
    const tokenFromCookie = typeof cookieValue === "string" ? cookieValue : undefined;
    const authHeader = req.header("authorization");
    const tokenFromBearer =
      authHeader?.startsWith("Bearer ") === true ? authHeader.slice(7) : undefined;
    const token = tokenFromCookie ?? tokenFromBearer;
    if (token) {
      await this.service.logout(token);
    }
    res.clearCookie(this.env.SESSION_COOKIE_NAME, sessionCookieOptions(this.env));
    sendSuccess(res, { loggedOut: true }, { requestId: getRequestId(req) });
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    await Promise.resolve();
    const principal = req.principal!;
    sendSuccess(
      res,
      toPublicJson({
        userId: principal.userId,
        username: principal.username,
        displayName: principal.displayName,
        permissions: [...principal.permissions],
      }),
      { requestId: getRequestId(req) },
    );
  });
}

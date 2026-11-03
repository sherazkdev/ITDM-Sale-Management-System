import type { AppEnv } from "../config/env.js";

export function sessionCookieOptions(env: AppEnv, expires?: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.NODE_ENV === "production",
    path: "/",
    ...(expires ? { expires } : {}),
  };
}

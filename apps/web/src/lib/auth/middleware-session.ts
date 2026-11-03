import { getSessionCookieName } from "@/lib/api/server-origin";

export type MiddlewareSessionResult = "authenticated" | "unauthenticated" | "api_unavailable";

type ValidateOptions = {
  cookieHeader: string | null;
  fetchMe: (cookieHeader: string) => Promise<Response>;
};

/** Testable middleware session check (no Next.js imports). */
export async function validateMiddlewareSession(options: ValidateOptions): Promise<MiddlewareSessionResult> {
  const cookieName = getSessionCookieName();
  const cookieHeader = options.cookieHeader;
  if (!cookieHeader?.includes(cookieName)) {
    return "unauthenticated";
  }

  try {
    const res = await options.fetchMe(cookieHeader);
    return res.ok ? "authenticated" : "unauthenticated";
  } catch {
    return "api_unavailable";
  }
}

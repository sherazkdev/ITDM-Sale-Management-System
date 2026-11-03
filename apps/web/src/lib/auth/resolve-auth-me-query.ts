import type { AuthMePayload } from "@/lib/api/client";
import { ApiClientError } from "@/lib/api/client";

export type AuthMeBootstrapResult =
  | { status: "authenticated"; user: AuthMePayload }
  | { status: "anonymous" }
  | { status: "service_unavailable" };

/**
 * Classifies `/auth/me` bootstrap failures.
 * - 401 → anonymous (API reachable, not signed in)
 * - status 0 / 5xx → service unavailable (no protected data shown)
 */
export function mapAuthMeQueryError(err: unknown): Exclude<AuthMeBootstrapResult, { status: "authenticated" }> {
  if (err instanceof ApiClientError) {
    if (err.status === 401) {
      return { status: "anonymous" };
    }
    if (err.status === 0 || err.status >= 500) {
      return { status: "service_unavailable" };
    }
    return { status: "anonymous" };
  }
  throw err;
}

export async function runAuthMeBootstrap(
  fetchMe: () => Promise<AuthMePayload>,
): Promise<AuthMeBootstrapResult> {
  try {
    const user = await fetchMe();
    return { status: "authenticated", user };
  } catch (err) {
    return mapAuthMeQueryError(err);
  }
}

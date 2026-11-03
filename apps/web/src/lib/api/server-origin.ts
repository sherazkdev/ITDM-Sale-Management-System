/** Server-side API origin (Express). Browser uses same-origin `/api/v1` proxy. */
export function getServerApiOrigin(): string {
  return (process.env.ITDMS_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function getSessionCookieName(): string {
  return process.env.ITDMS_SESSION_COOKIE_NAME ?? "itdms_session";
}

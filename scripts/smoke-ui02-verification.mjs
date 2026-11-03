#!/usr/bin/env node
/**
 * UI02 final checks against running Express API (+ optional Next on WEB_ORIGIN).
 */
const API = (process.env.ITDMS_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const WEB = process.env.WEB_ORIGIN?.replace(/\/$/, "");

async function login(base, body) {
  const res = await fetch(`${base}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  const setCookie = res.headers.getSetCookie?.() ?? [];
  return { status: res.status, json, setCookie };
}

function cookieHeader(setCookie) {
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function me(base, cookie) {
  const res = await fetch(`${base}/api/v1/auth/me`, { headers: cookie ? { cookie } : {} });
  return { status: res.status, json: await res.json() };
}

async function main() {
  console.log("UI02 integration checks\n");

  const bad = await login(API, { username: "x", password: "y" });
  if (bad.status !== 401) throw new Error(`invalid login expected 401, got ${bad.status}`);
  console.log("[pass] invalid login -> 401");

  const good = await login(API, { username: "admin.dev", password: "ChangeMe_DevOnly!" });
  if (good.status !== 200) {
    throw new Error(`login failed ${good.status} — seed DB?`);
  }
  const cookie = cookieHeader(good.setCookie);
  console.log("[pass] valid login -> 200 + Set-Cookie");

  const profile = await me(API, cookie);
  if (profile.status !== 200 || !Array.isArray(profile.json?.data?.permissions)) {
    throw new Error("GET /auth/me failed after login");
  }
  const permCount = profile.json.data.permissions.length;
  console.log(`[pass] session persistence via cookie -> me (${permCount} permissions)`);

  const employees = await fetch(`${API}/api/v1/employees`, { headers: { cookie } });
  if (employees.status !== 200) throw new Error("protected API without proper session");
  console.log("[pass] protected API accepts session cookie");

  const noAuth = await fetch(`${API}/api/v1/employees`);
  if (noAuth.status !== 401) throw new Error(`unauthenticated API expected 401, got ${noAuth.status}`);
  console.log("[pass] protected API rejects missing cookie -> 401");

  await fetch(`${API}/api/v1/auth/logout`, { method: "POST", headers: { cookie } });
  const afterLogout = await me(API, cookie);
  if (afterLogout.status !== 401) throw new Error("expected 401 after logout");
  console.log("[pass] logout revokes session -> me 401");

  if (WEB) {
    const dash = await fetch(`${WEB}/dashboard`, { redirect: "manual" });
    const loc = dash.headers.get("location") ?? "";
    if (dash.status !== 307 && dash.status !== 302) {
      console.warn(`[warn] WEB /dashboard without cookie status ${dash.status} (expected redirect)`);
    } else if (!loc.includes("/login")) {
      throw new Error(`expected redirect to login, got ${loc}`);
    } else {
      console.log("[pass] Next middleware redirects unauthenticated /dashboard -> /login");
    }

    const stale = await fetch(`${WEB}/dashboard`, {
      redirect: "manual",
      headers: { cookie: "itdms_session=invalid-session-id" },
    });
    const staleLoc = stale.headers.get("location") ?? "";
    if (!staleLoc.includes("reason=session_expired")) {
      throw new Error(`expected session_expired redirect, got ${staleLoc}`);
    }
    console.log("[pass] stale session cookie -> /login?reason=session_expired");
  }

  console.log("\nAll UI02 integration checks passed.");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});

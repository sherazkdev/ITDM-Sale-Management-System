/**
 * Smoke-test auth against running API (and optional Next proxy).
 *
 * Usage:
 *   node scripts/smoke-web-auth.mjs
 *   WEB_ORIGIN=http://localhost:3011 node scripts/smoke-web-auth.mjs
 */
const API = (process.env.ITDMS_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const WEB = process.env.WEB_ORIGIN?.replace(/\/$/, "");
const CSRF_HEADERS = { "x-itdms-requested-with": "itdms" };

async function login(base, body) {
  const res = await fetch(`${base}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    redirect: "manual",
  });
  const json = await res.json().catch(() => null);
  const setCookie = res.headers.getSetCookie?.() ?? [];
  return { status: res.status, json, setCookie, rawCookie: res.headers.get("set-cookie") };
}

async function me(base, cookieHeader) {
  const res = await fetch(`${base}/api/v1/auth/me`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

function cookieFromSetCookie(setCookie) {
  if (setCookie?.length) {
    return setCookie.map((c) => c.split(";")[0]).join("; ");
  }
  return null;
}

async function runOnBase(label, base, useCredentials) {
  console.log(`\n=== ${label} (${base}) ===`);

  const bad = await login(base, { username: "nope", password: "bad" });
  if (bad.status !== 401) {
    throw new Error(`${label}: expected 401 invalid login, got ${bad.status}`);
  }
  console.log("invalid login -> 401 OK");

  const good = await login(base, { username: "admin.dev", password: "ChangeMe_DevOnly!" });
  if (good.status !== 200 || !good.json?.success) {
    throw new Error(
      `${label}: login failed ${good.status} — seed user missing? run: cd apps/api && npx prisma db seed`,
    );
  }
  const cookie =
    useCredentials && typeof fetch !== "undefined"
      ? null
      : cookieFromSetCookie(good.setCookie) ?? good.rawCookie?.split(";")[0];
  console.log("valid login -> 200 OK");

  const profile = await me(
    base,
    useCredentials ? undefined : cookie,
  );
  if (profile.status !== 200 || !profile.json?.data?.permissions) {
    throw new Error(`${label}: /auth/me failed ${profile.status}`);
  }
  console.log(`me -> permissions: ${profile.json.data.permissions.length}`);

  const logout = await fetch(`${base}/api/v1/auth/logout`, {
    method: "POST",
    headers: cookie ? { cookie, ...CSRF_HEADERS } : CSRF_HEADERS,
    credentials: useCredentials ? "include" : undefined,
  });
  if (logout.status !== 200) {
    throw new Error(`${label}: logout failed ${logout.status}`);
  }
  console.log("logout -> 200 OK");

  const after = await me(base, cookie);
  if (after.status !== 401) {
    throw new Error(`${label}: expected 401 after logout, got ${after.status}`);
  }
  console.log("me after logout -> 401 OK");
}

async function main() {
  await runOnBase("Express API", API, false);
  if (WEB) {
    const res = await fetch(`${WEB}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin.dev", password: "ChangeMe_DevOnly!" }),
      credentials: "include",
    });
    if (!res.ok) {
      console.warn(`WEB proxy check skipped — login via ${WEB} returned ${res.status}`);
    } else {
      const setCookie = res.headers.getSetCookie?.() ?? [];
      console.log(`\n=== Next proxy Set-Cookie headers: ${setCookie.length} ===`);
      if (setCookie.length === 0) {
        console.warn("WARN: no Set-Cookie on proxied login — verify route handler");
      } else {
        console.log("proxied login Set-Cookie present OK");
      }
    }
  }
  console.log("\nAll smoke checks passed.");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});

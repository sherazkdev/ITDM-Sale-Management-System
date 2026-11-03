import { NextResponse, type NextRequest } from "next/server";
import { getServerApiOrigin, getSessionCookieName } from "@/lib/api/server-origin";
import { validateMiddlewareSession } from "@/lib/auth/middleware-session";

const PUBLIC_PATHS = ["/login"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/v1") || pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const origin = getServerApiOrigin();
  const session = await validateMiddlewareSession({
    cookieHeader: request.headers.get("cookie"),
    fetchMe: (cookieHeader) =>
      fetch(`${origin}/api/v1/auth/me`, {
        headers: { cookie: cookieHeader },
        cache: "no-store",
      }),
  });

  if (isPublicPath(pathname)) {
    if (session === "authenticated") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (session === "authenticated") {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  if (session === "api_unavailable") {
    loginUrl.searchParams.set("reason", "api_unavailable");
  } else if (request.cookies.has(getSessionCookieName())) {
    loginUrl.searchParams.set("reason", "session_expired");
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api|favicon.ico).*)"],
};

import { NextRequest, NextResponse } from "next/server";
import { getServerApiOrigin } from "@/lib/api/server-origin";

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxyRequest(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  const segment = path.join("/");
  const origin = getServerApiOrigin();
  const incoming = new URL(request.url);
  const target = new URL(`/api/v1/${segment}`, origin);
  target.search = incoming.search;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);
  const requestId = request.headers.get("x-request-id");
  if (requestId) headers.set("x-request-id", requestId);
  const csrf = request.headers.get("x-itdms-requested-with");
  if (csrf) headers.set("x-itdms-requested-with", csrf);

  const method = request.method.toUpperCase();
  const maxBodyBytes = 12 * 1024 * 1024;
  const body =
    method === "GET" || method === "HEAD" || method === "OPTIONS"
      ? undefined
      : await request.text();
  if (body && body.length > maxBodyBytes) {
    return NextResponse.json(
      { success: false, error: { code: "PAYLOAD_TOO_LARGE", message: "Request body too large" } },
      { status: 413 },
    );
  }

  const upstream = await fetch(target, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "transfer-encoding" || lower === "connection" || lower === "set-cookie") {
      return;
    }
    responseHeaders.set(key, value);
  });

  const setCookies =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : upstream.headers.get("set-cookie")
        ? [upstream.headers.get("set-cookie")!]
        : [];

  for (const c of setCookies) {
    responseHeaders.append("set-cookie", c);
  }

  const responseBody = await upstream.arrayBuffer();
  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;

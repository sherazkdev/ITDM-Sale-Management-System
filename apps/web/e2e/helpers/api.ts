import type { APIRequestContext, Page } from "@playwright/test";

export const CSRF_HEADER = { "x-itdms-requested-with": "itdms" };

export async function apiJson<T>(
  request: APIRequestContext,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; json: T }> {
  const res = await request.fetch(`/api/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...CSRF_HEADER,
    },
    data: body,
  });
  const text = await res.text();
  let json: T;
  try {
    json = JSON.parse(text) as T;
  } catch {
    throw new Error(
      `API ${method} /api/v1${path} returned non-JSON (HTTP ${res.status}): ${text.slice(0, 120)}`,
    );
  }
  return { status: res.status(), json };
}

export async function apiGetEnvelope<T>(page: Page, path: string) {
  return apiJson<{ success: boolean; data: T }>(page.request, "GET", path);
}

export async function apiPostEnvelope<T>(page: Page, path: string, body: unknown) {
  return apiJson<{ success: boolean; data: T; error?: { code: string; message: string } }>(
    page.request,
    "POST",
    path,
    body,
  );
}

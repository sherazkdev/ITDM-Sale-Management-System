/**
 * ITDMS API client — `{ success, data, meta }` envelope (Express backend).
 */

import { getServerApiOrigin } from "./server-origin";

/** Cookie-authenticated mutation CSRF token (must match API middleware). */
export const CSRF_HEADER_NAME = "X-ITDMS-Requested-With";
export const CSRF_HEADER_VALUE = "itdms";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export type ApiMeta = {
  requestId: string;
  page?: number;
  pageSize?: number;
  total?: number;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta: ApiMeta;
};

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: ApiMeta;
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiErrorBody;

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/** Browser: same-origin proxy. Server (middleware): direct API origin. */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "/api/v1";
  }
  return `${getServerApiOrigin()}/api/v1`;
}

export type ApiFetchOptions = RequestInit & {
  /** Skip JSON parse (downloads). */
  raw?: boolean;
};

export async function apiFetch<T>(path: string, init?: ApiFetchOptions): Promise<ApiSuccess<T>> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBaseUrl();
  const url = `${base}${normalizedPath}`;

  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (
    typeof window !== "undefined" &&
    init?.method &&
    MUTATION_METHODS.has(init.method.toUpperCase())
  ) {
    headers.set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
      credentials: typeof window !== "undefined" ? "include" : init?.credentials,
      cache: "no-store",
    });
  } catch {
    throw new ApiClientError("Network error — check your connection and try again.", 0, "NETWORK_ERROR");
  }

  if (init?.raw) {
    if (!response.ok) {
      throw new ApiClientError(response.statusText || "Request failed", response.status);
    }
    return {
      success: true,
      data: (await response.blob()) as unknown as T,
      meta: { requestId: response.headers.get("x-request-id") ?? "unknown" },
    };
  }

  let body: ApiEnvelope<T>;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiClientError("Invalid response from server", response.status, "INVALID_RESPONSE");
  }

  if (!body.success) {
    throw new ApiClientError(body.error.message, response.status, body.error.code, body.error.details);
  }

  return body;
}

export async function apiGet<T>(path: string, init?: Omit<ApiFetchOptions, "method" | "body">): Promise<T> {
  const res = await apiFetch<T>(path, { ...init, method: "GET" });
  return res.data;
}

export type PaginatedResult<T> = {
  data: T[];
  meta: ApiMeta & { page: number; pageSize: number; total: number };
};

export async function apiGetPage<T>(
  path: string,
  init?: Omit<ApiFetchOptions, "method" | "body">,
): Promise<PaginatedResult<T>> {
  const res = await apiFetch<T[]>(path, { ...init, method: "GET" });
  return {
    data: res.data,
    meta: {
      ...res.meta,
      page: res.meta.page ?? 1,
      pageSize: res.meta.pageSize ?? 20,
      total: res.meta.total ?? res.data.length,
    },
  };
}

export async function apiPatch<T, B = unknown>(
  path: string,
  body?: B,
  init?: Omit<ApiFetchOptions, "method" | "body">,
): Promise<T> {
  const res = await apiFetch<T>(path, {
    ...init,
    method: "PATCH",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return res.data;
}

export async function apiPut<T, B = unknown>(
  path: string,
  body?: B,
  init?: Omit<ApiFetchOptions, "method" | "body">,
): Promise<T> {
  const res = await apiFetch<T>(path, {
    ...init,
    method: "PUT",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return res.data;
}

export async function apiDelete<T>(path: string, init?: Omit<ApiFetchOptions, "method" | "body">): Promise<T> {
  const res = await apiFetch<T>(path, { ...init, method: "DELETE" });
  return res.data;
}

export async function apiPost<T, B = unknown>(
  path: string,
  body?: B,
  init?: Omit<ApiFetchOptions, "method" | "body">,
): Promise<T> {
  const res = await apiFetch<T>(path, {
    ...init,
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return res.data;
}

/** Binary GET (documents, report exports). Parses JSON error bodies when present. */
export async function apiFetchBinary(
  path: string,
  init?: Omit<ApiFetchOptions, "raw" | "body">,
): Promise<{ blob: Blob; headers: Headers }> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${getApiBaseUrl()}${normalizedPath}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      method: "GET",
      credentials: typeof window !== "undefined" ? "include" : init?.credentials,
      cache: "no-store",
    });
  } catch {
    throw new ApiClientError("Network error — check your connection and try again.", 0, "NETWORK_ERROR");
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        const body = (await response.json()) as ApiErrorBody;
        throw new ApiClientError(body.error.message, response.status, body.error.code, body.error.details);
      } catch (err) {
        if (err instanceof ApiClientError) throw err;
      }
    }
    throw new ApiClientError(response.statusText || "Request failed", response.status);
  }

  return { blob: await response.blob(), headers: response.headers };
}

export function saveBlobAsFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export type AuthMePayload = {
  userId: string;
  username: string;
  displayName: string;
  permissions: string[];
};

export type LoginPayload = {
  userId: string;
  username: string;
  displayName: string;
};

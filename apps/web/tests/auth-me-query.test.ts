import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../src/lib/api/client";
import { mapAuthMeQueryError, runAuthMeBootstrap } from "../src/lib/auth/resolve-auth-me-query";
import { validateMiddlewareSession } from "../src/lib/auth/middleware-session";

describe("mapAuthMeQueryError", () => {
  it("returns anonymous for 401", () => {
    expect(mapAuthMeQueryError(new ApiClientError("Unauthorized", 401, "UNAUTHORIZED"))).toEqual({
      status: "anonymous",
    });
  });

  it("returns service_unavailable for network (status 0)", () => {
    expect(mapAuthMeQueryError(new ApiClientError("Network error", 0, "NETWORK_ERROR"))).toEqual({
      status: "service_unavailable",
    });
  });

  it("returns service_unavailable for 503", () => {
    expect(mapAuthMeQueryError(new ApiClientError("Down", 503, "INTERNAL_ERROR"))).toEqual({
      status: "service_unavailable",
    });
  });

  it("rethrows non-API errors", () => {
    expect(() => mapAuthMeQueryError(new TypeError("boom"))).toThrow(TypeError);
  });
});

describe("runAuthMeBootstrap", () => {
  it("returns authenticated payload on success", async () => {
    const result = await runAuthMeBootstrap(async () => ({
      userId: "1",
      username: "u",
      displayName: "U",
      permissions: ["employees.read"],
    }));
    expect(result.status).toBe("authenticated");
  });
});

describe("validateMiddlewareSession", () => {
  it("returns unauthenticated without session cookie", async () => {
    const result = await validateMiddlewareSession({
      cookieHeader: null,
      fetchMe: vi.fn(),
    });
    expect(result).toBe("unauthenticated");
  });

  it("returns authenticated when fetch ok", async () => {
    const result = await validateMiddlewareSession({
      cookieHeader: "itdms_session=abc",
      fetchMe: vi.fn().mockResolvedValue({ ok: true }),
    });
    expect(result).toBe("authenticated");
  });

  it("returns unauthenticated when fetch 401", async () => {
    const result = await validateMiddlewareSession({
      cookieHeader: "itdms_session=abc",
      fetchMe: vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    });
    expect(result).toBe("unauthenticated");
  });

  it("returns api_unavailable when fetch throws", async () => {
    const result = await validateMiddlewareSession({
      cookieHeader: "itdms_session=abc",
      fetchMe: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    });
    expect(result).toBe("api_unavailable");
  });
});

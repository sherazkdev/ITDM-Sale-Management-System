import { expect } from "vitest";
import request from "supertest";
import type { Express } from "express";
import {
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
} from "../../src/shared/middleware/csrf.middleware.js";

export function cookiePairFromSetCookie(setCookie: string | string[] | undefined): string {
  const raw = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  if (!raw) {
    throw new Error("Expected Set-Cookie header");
  }
  return raw.split(";")[0]!.trim();
}

/** Cookie + CSRF headers for supertest (matches browser client). */
export function sessionRequestHeaders(cookiePair: string): Record<string, string> {
  return {
    Cookie: cookiePair,
    [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
  };
}

export async function loginAsAdmin(app: Express): Promise<string> {
  const login = await request(app)
    .post("/api/v1/auth/login")
    .send({ username: "admin.dev", password: "ChangeMe_DevOnly!" });
  expect(login.status).toBe(200);
  return cookiePairFromSetCookie(login.headers["set-cookie"]);
}

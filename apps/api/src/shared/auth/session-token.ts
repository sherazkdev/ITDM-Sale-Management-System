import { createHash, createHmac, randomBytes } from "node:crypto";
import { loadEnv } from "../config/env.js";

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  const secret = loadEnv().SESSION_SECRET;
  return createHmac("sha256", secret).update(token).digest("hex");
}

/** Legacy SHA-256-only hashes (pre-hardening sessions) — drop after all sessions rotate. */
export function legacyHashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

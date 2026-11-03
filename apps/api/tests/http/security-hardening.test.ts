import { describe, expect, it } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import { loadEnv, resetEnvCacheForTests } from "../../src/shared/config/env.js";
import {
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
  createCsrfProtection,
} from "../../src/shared/middleware/csrf.middleware.js";
import { hashSessionToken, legacyHashSessionToken } from "../../src/shared/auth/session-token.js";

describe("Security hardening", () => {
  it("hashes session tokens with SESSION_SECRET (HMAC)", () => {
    delete process.env.ITDMS_STAGING_STRICT;
    process.env.SESSION_SECRET = "test-secret-at-least-sixteen-chars-ok";
    resetEnvCacheForTests();
    const token = "sample-token-value";
    expect(hashSessionToken(token)).not.toEqual(legacyHashSessionToken(token));
    expect(hashSessionToken(token)).toEqual(hashSessionToken(token));
    resetEnvCacheForTests();
  });

  it("CSRF middleware rejects cookie-authenticated POST without header", async () => {
    delete process.env.ITDMS_STAGING_STRICT;
    process.env.SESSION_SECRET = "test-secret-at-least-sixteen-chars-ok";
    process.env.SESSION_COOKIE_NAME = "itdms_session";
    resetEnvCacheForTests();

    const app = express();
    app.use(cookieParser());
    app.use(createCsrfProtection({ disabled: false }));
    app.post("/api/v1/employees", (_req, res) => {
      res.status(204).end();
    });

    await request(app)
      .post("/api/v1/employees")
      .set("Cookie", "itdms_session=fake")
      .send({ name: "x" })
      .expect(403);

    await request(app)
      .post("/api/v1/employees")
      .set("Cookie", "itdms_session=fake")
      .set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE)
      .send({ name: "x" })
      .expect(204);

    resetEnvCacheForTests();
  });

  it("CSRF middleware rejects Bearer+cookie bypass without header", async () => {
    delete process.env.ITDMS_STAGING_STRICT;
    process.env.SESSION_SECRET = "test-secret-at-least-sixteen-chars-ok";
    resetEnvCacheForTests();

    const app = express();
    app.use(cookieParser());
    app.use(createCsrfProtection({ disabled: false }));
    app.post("/api/v1/employees", (_req, res) => {
      res.status(204).end();
    });

    await request(app)
      .post("/api/v1/employees")
      .set("Authorization", "Bearer service-token")
      .set("Cookie", "itdms_session=ignored")
      .send({ name: "x" })
      .expect(403);

    resetEnvCacheForTests();
  });

  it("CSRF middleware allows Bearer-only POST without session cookie", async () => {
    delete process.env.ITDMS_STAGING_STRICT;
    process.env.SESSION_SECRET = "test-secret-at-least-sixteen-chars-ok";
    resetEnvCacheForTests();

    const app = express();
    app.use(cookieParser());
    app.use(createCsrfProtection({ disabled: false }));
    app.post("/api/v1/employees", (_req, res) => {
      res.status(204).end();
    });

    await request(app)
      .post("/api/v1/employees")
      .set("Authorization", "Bearer service-token")
      .send({ name: "x" })
      .expect(204);

    resetEnvCacheForTests();
  });

  it("rejects production env when SESSION_SECRET is too short", () => {
    process.env.NODE_ENV = "production";
    process.env.SESSION_SECRET = "too-short";
    process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/db";
    resetEnvCacheForTests();
    expect(() => loadEnv(process.env)).toThrow(/SESSION_SECRET/);
    process.env.NODE_ENV = "test";
    resetEnvCacheForTests();
  });
});

import { describe, expect, it } from "vitest";
import { resetEnvCacheForTests, loadEnv } from "../../src/shared/config/env.js";

describe("Staging / production env guards", () => {
  it("rejects ITDMS_DISABLE_CSRF when ITDMS_STAGING_STRICT=1", () => {
    resetEnvCacheForTests();
    const prev = process.env.ITDMS_DISABLE_CSRF;
    process.env.ITDMS_STAGING_STRICT = "1";
    process.env.NODE_ENV = "development";
    process.env.DATABASE_URL = "postgresql://u:p@127.0.0.1:5432/db";
    process.env.SESSION_SECRET = "a".repeat(32);
    process.env.ITDMS_DISABLE_CSRF = "1";
    expect(() => loadEnv()).toThrow(/ITDMS_DISABLE_CSRF/);
    process.env.ITDMS_DISABLE_CSRF = prev;
    resetEnvCacheForTests();
  });

  it("requires 32+ char SESSION_SECRET when ITDMS_STAGING_STRICT=1", () => {
    resetEnvCacheForTests();
    process.env.ITDMS_STAGING_STRICT = "1";
    process.env.NODE_ENV = "development";
    process.env.DATABASE_URL = "postgresql://u:p@127.0.0.1:5432/db";
    process.env.SESSION_SECRET = "too-short";
    delete process.env.ITDMS_DISABLE_CSRF;
    expect(() => loadEnv()).toThrow(/SESSION_SECRET/);
    resetEnvCacheForTests();
  });
});

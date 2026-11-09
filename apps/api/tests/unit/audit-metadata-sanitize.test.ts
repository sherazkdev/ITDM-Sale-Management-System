import { describe, expect, it } from "vitest";
import { sanitizeAuditMetadataForExport } from "../../src/shared/export/audit-metadata-sanitize.js";

describe("sanitizeAuditMetadataForExport", () => {
  it("redacts sensitive metadata keys", () => {
    const raw = {
      username: "admin.dev",
      password: "should-not-export",
      nested: { authToken: "secret", ok: true },
    };
    const parsed = JSON.parse(sanitizeAuditMetadataForExport(raw));
    expect(parsed.password).toBe("[REDACTED]");
    expect(parsed.nested.authToken).toBe("[REDACTED]");
    expect(parsed.nested.ok).toBe(true);
    expect(parsed.username).toBe("admin.dev");
  });
});

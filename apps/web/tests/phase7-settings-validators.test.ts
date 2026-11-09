import { describe, expect, it } from "vitest";

import {
  passwordChangeSchema,
  profileSettingsSchema,
  validateAvatarFile,
} from "@/lib/validators/settings";
import { LIST_REPORT_EXPORT } from "@/lib/list-export-config";

describe("settings validators", () => {
  it("profile schema rejects empty display name", () => {
    const result = profileSettingsSchema.safeParse({ displayName: "" });
    expect(result.success).toBe(false);
  });

  it("password schema requires matching confirmation", () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: "old-password-12",
      newPassword: "new-password-1234",
      confirmPassword: "mismatch",
    });
    expect(result.success).toBe(false);
  });

  it("validateAvatarFile rejects oversize files", () => {
    const err = validateAvatarFile({ type: "image/png", size: 3_000_000 });
    expect(err).toMatch(/2 MB/);
  });
});

describe("list export registry", () => {
  it("includes maintenance and audit exports", () => {
    expect(LIST_REPORT_EXPORT.maintenance.reportSlug).toBe("maintenance");
    expect(LIST_REPORT_EXPORT["audit-logs"].exportPermission).toBe("auditRead");
    expect(LIST_REPORT_EXPORT["document-metadata"].exportPermission).toBe("documentsRead");
  });
});

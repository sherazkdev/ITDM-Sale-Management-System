import { describe, expect, it } from "vitest";
import { uploadDocumentSchema, documentLookupSchema } from "@/lib/validators/document";
import { createAdminUserSchema, setUserRolesSchema } from "@/lib/validators/admin-user";

describe("UI07 document validators", () => {
  it("accepts valid upload payload shape", () => {
    const parsed = uploadDocumentSchema.parse({
      ownerType: "purchase_order",
      ownerId: "42",
      originalFileName: "scan.pdf",
      mimeType: "application/pdf",
      contentBase64: "YWJj",
    });
    expect(parsed.ownerId).toBe("42");
  });

  it("rejects invalid document id lookup", () => {
    expect(() => documentLookupSchema.parse({ documentId: "abc" })).toThrow();
  });
});

describe("UI07 admin validators", () => {
  it("requires role keys on create", () => {
    expect(() =>
      createAdminUserSchema.parse({
        username: "user.test",
        displayName: "User Test",
        password: "LongEnoughPass1",
        roleKeys: [],
      }),
    ).toThrow();
  });

  it("accepts set roles", () => {
    const parsed = setUserRolesSchema.parse({ roleKeys: ["admin"] });
    expect(parsed.roleKeys).toEqual(["admin"]);
  });
});

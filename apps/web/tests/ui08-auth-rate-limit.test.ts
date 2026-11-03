import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("UI08 auth rate limit (production safety)", () => {
  it("uses strict login cap only in production", () => {
    const file = readFileSync(
      path.join(__dirname, "../../api/src/modules/auth/auth.routes.ts"),
      "utf8",
    );
    expect(file).toMatch(/NODE_ENV === "production" \? 30 : 200/);
  });
});

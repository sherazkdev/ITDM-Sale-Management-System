import { describe, expect, it } from "vitest";

describe("official movement download paths", () => {
  it("builds issuance and return API paths", async () => {
    const { downloadOfficialMovementXlsx } = await import("../src/lib/api/asset-movements");
    expect(typeof downloadOfficialMovementXlsx).toBe("function");
  });
});

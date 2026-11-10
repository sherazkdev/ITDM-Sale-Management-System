import { describe, expect, it } from "vitest";
import { formatDateOnly } from "@/lib/utils";

describe("formatDateOnly", () => {
  it("formats a midnight UTC timestamp as the stored calendar date", () => {
    expect(formatDateOnly("2026-02-01T00:00:00.000Z")).toBe("1 Feb 2026");
  });

  it("formats a date-only value without shifting the day", () => {
    expect(formatDateOnly("2026-02-01")).toBe("1 Feb 2026");
  });

  it("uses the fallback for empty values", () => {
    expect(formatDateOnly(null)).toBe("—");
    expect(formatDateOnly("")).toBe("—");
  });

  it("leaves non-dates unchanged", () => {
    expect(formatDateOnly("not-a-date")).toBe("not-a-date");
  });
});

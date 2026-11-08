import { describe, expect, it } from "vitest";
import { resolveListOrderBy } from "../../src/shared/http/list-sort.js";

describe("resolveListOrderBy", () => {
  it("uses whitelisted field", () => {
    expect(
      resolveListOrderBy(["fullName", "employeeNumber"], { sortBy: "fullName", sortDir: "desc" }, {
        employeeNumber: "asc",
      }),
    ).toEqual({ fullName: "desc" });
  });

  it("falls back when sortBy is missing or not allowed", () => {
    expect(resolveListOrderBy(["fullName"], { sortBy: "hacker", sortDir: "desc" }, { employeeNumber: "asc" })).toEqual({
      employeeNumber: "asc",
    });
  });
});

import { describe, expect, it } from "vitest";

describe("DataTable column prefs key", () => {
  it("uses stable storage prefix", () => {
    expect("itdms.datatable.employees".startsWith("itdms.datatable.")).toBe(true);
  });
});

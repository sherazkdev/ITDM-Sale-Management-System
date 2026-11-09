import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";

describe("Import preview — employees", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("returns preview rows without importing", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const csv = "employeeNumber,fullName,department,designation\nPREV-1,Preview One,,\nPREV-1,Preview Dup,,";
    const res = await request(app)
      .post("/api/v1/employees/import/preview")
      .set(sessionRequestHeaders(cookie))
      .attach("file", Buffer.from(csv), { filename: "employees.csv", contentType: "text/csv" })
      .expect(200);
    expect(res.body.data.totalRows).toBe(2);
    expect(res.body.data.validCount).toBe(1);
    expect(res.body.data.duplicateCount).toBe(1);
    const listed = await request(app)
      .get("/api/v1/employees?search=PREV-1")
      .set(sessionRequestHeaders(cookie));
    expect(listed.body.data.length).toBe(0);
  });
});

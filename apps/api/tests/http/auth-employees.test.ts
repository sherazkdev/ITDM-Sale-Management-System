import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { cookiePairFromSetCookie, sessionRequestHeaders } from "../helpers/auth-test.js";

describe("Auth and employees API", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("logs in and creates an employee with permissions", async () => {
    const app = buildApplication().app;
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "admin.dev", password: "ChangeMe_DevOnly!" });

    if (login.status === 401) {
      expect.fail("Seed user missing — run: cd apps/api && npx prisma db seed");
    }

    expect(login.status).toBe(200);
    const cookie = cookiePairFromSetCookie(login.headers["set-cookie"]);

    const create = await request(app)
      .post("/api/v1/employees")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeNumber: `EMP-${Date.now()}`,
        fullName: "Test Employee",
        department: "IT",
      })
      .expect(201);

    expect(create.body.success).toBe(true);
    expect(create.body.data.fullName).toBe("Test Employee");
  });

  it("rejects employee create without auth", async () => {
    const app = buildApplication().app;
    await request(app)
      .post("/api/v1/employees")
      .send({ employeeNumber: "X", fullName: "No Auth" })
      .expect(401);
  });
});

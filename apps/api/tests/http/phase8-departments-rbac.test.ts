import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";

describe("Phase 8 — departments and dynamic RBAC", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("creates department and rejects duplicate code", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const code = `qa_dept_${Date.now()}`;
    const created = await request(app)
      .post("/api/v1/departments")
      .set(sessionRequestHeaders(cookie))
      .send({ departmentName: "QA Department", departmentCode: code })
      .expect(201);
    expect(created.body.data.departmentName).toBe("QA Department");
    await request(app)
      .post("/api/v1/departments")
      .set(sessionRequestHeaders(cookie))
      .send({ departmentName: "QA Department 2", departmentCode: code })
      .expect(409);
  });

  it("blocks financial.corrections on it_admin_proposed system role", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const roles = await request(app).get("/api/v1/roles").set(sessionRequestHeaders(cookie)).expect(200);
    const proposed = roles.body.data.find((r: { roleKey: string }) => r.roleKey === "it_admin_proposed");
    expect(proposed).toBeTruthy();
    await request(app)
      .put(`/api/v1/roles/${proposed.roleId}/permissions`)
      .set(sessionRequestHeaders(cookie))
      .send({ permissionKeys: ["financial.corrections", "employees.read"] })
      .expect(403);
  });

  it("blocks financial.corrections on custom role", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const created = await request(app)
      .post("/api/v1/roles")
      .set(sessionRequestHeaders(cookie))
      .send({ displayName: `Restricted ${Date.now()}`, colorKey: "slate" })
      .expect(201);
    const roleId = created.body.data.roleId;
    await request(app)
      .put(`/api/v1/roles/${roleId}/permissions`)
      .set(sessionRequestHeaders(cookie))
      .send({ permissionKeys: ["financial.corrections", "employees.read"] })
      .expect(403);
    await request(app)
      .put(`/api/v1/roles/${roleId}/permissions`)
      .set(sessionRequestHeaders(cookie))
      .send({ permissionKeys: ["employees.read"] })
      .expect(200);
  });
});

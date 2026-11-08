import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";

describe("D09 — non-asset stock movements", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  async function registerCable(app: ReturnType<typeof buildApplication>["app"], cookie: string, ts: number) {
    const cat = await request(app)
      .post("/api/v1/asset-categories")
      .set(sessionRequestHeaders(cookie))
      .send({ categoryName: `D09-${ts}` })
      .expect(201);
    const created = await request(app)
      .post("/api/v1/non-asset-stock-items")
      .set(sessionRequestHeaders(cookie))
      .send({
        stockCode: `CABLE-D09-${ts}`,
        itemName: "Network cable",
        categoryId: cat.body.data.categoryId,
        quantityOnHand: 100,
        unitOfMeasure: "FEET",
      })
      .expect(201);
    return created.body.data as { stockItemId: string };
  }

  it("client scenario 100 → 80 → 85 → 75 with decimals", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();
    const item = await registerCable(app, cookie, ts);
    const id = item.stockItemId;

    const employee = await request(app)
      .post("/api/v1/employees")
      .set(sessionRequestHeaders(cookie))
      .send({
        employeeNumber: `D09-E-${ts}`,
        fullName: "Cable Tech",
        department: "IT Ops",
      })
      .expect(201);

    await request(app)
      .post(`/api/v1/non-asset-stock-items/${id}/movements/issue`)
      .set(sessionRequestHeaders(cookie))
      .send({ quantity: 20, employeeId: employee.body.data.employeeId })
      .expect(201);
    let row = await request(app)
      .get(`/api/v1/non-asset-stock-items/${id}`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(Number(row.body.data.quantityAvailable)).toBe(80);

    await request(app)
      .post(`/api/v1/non-asset-stock-items/${id}/movements/return`)
      .set(sessionRequestHeaders(cookie))
      .send({ quantity: 5, employeeId: employee.body.data.employeeId })
      .expect(201);
    row = await request(app)
      .get(`/api/v1/non-asset-stock-items/${id}`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(Number(row.body.data.quantityAvailable)).toBe(85);

    await request(app)
      .post(`/api/v1/non-asset-stock-items/${id}/movements/write-off`)
      .set(sessionRequestHeaders(cookie))
      .send({ quantity: 10, referenceReason: "Damaged" })
      .expect(201);
    row = await request(app)
      .get(`/api/v1/non-asset-stock-items/${id}`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(Number(row.body.data.quantityAvailable)).toBe(75);

    const decimal = await request(app)
      .post(`/api/v1/non-asset-stock-items/${id}/movements/replenish`)
      .set(sessionRequestHeaders(cookie))
      .send({ quantity: 2.5 })
      .expect(201);
    expect(Number(decimal.body.data.item.quantityAvailable)).toBe(77.5);
  });

  it("rejects insufficient stock and excessive return", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();
    const item = await registerCable(app, cookie, ts);
    const id = item.stockItemId;

    const bad = await request(app)
      .post(`/api/v1/non-asset-stock-items/${id}/movements/issue`)
      .set(sessionRequestHeaders(cookie))
      .send({ quantity: 200, department: "Facilities" })
      .expect(422);
    expect(bad.body.error.code).toBe("VALIDATION_ERROR");

    const emp = await request(app)
      .post("/api/v1/employees")
      .set(sessionRequestHeaders(cookie))
      .send({ employeeNumber: `D09-R-${ts}`, fullName: "Return QA", department: "IT" })
      .expect(201);

    await request(app)
      .post(`/api/v1/non-asset-stock-items/${id}/movements/issue`)
      .set(sessionRequestHeaders(cookie))
      .send({ quantity: 10, employeeId: emp.body.data.employeeId })
      .expect(201);

    const overReturn = await request(app)
      .post(`/api/v1/non-asset-stock-items/${id}/movements/return`)
      .set(sessionRequestHeaders(cookie))
      .send({ quantity: 15, employeeId: emp.body.data.employeeId })
      .expect(422);
    expect(overReturn.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("honors idempotency key on issue", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();
    const item = await registerCable(app, cookie, ts);
    const key = randomUUID();
    const body = { quantity: 3, department: "Stores", idempotencyKey: key };
    await request(app)
      .post(`/api/v1/non-asset-stock-items/${item.stockItemId}/movements/issue`)
      .set(sessionRequestHeaders(cookie))
      .send(body)
      .expect(201);
    const again = await request(app)
      .post(`/api/v1/non-asset-stock-items/${item.stockItemId}/movements/issue`)
      .set(sessionRequestHeaders(cookie))
      .send(body)
      .expect(201);
    const movements = await request(app)
      .get(`/api/v1/non-asset-stock-items/${item.stockItemId}/movements`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    const issueCount = movements.body.data.filter(
      (m: { idempotencyKey: string | null }) => m.idempotencyKey === key,
    ).length;
    expect(issueCount).toBe(1);
    expect(Number(again.body.data.item.quantityAvailable)).toBe(97);
  });

  it("lists movement history", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const ts = Date.now();
    const item = await registerCable(app, cookie, ts);
    const list = await request(app)
      .get(`/api/v1/non-asset-stock-items/${item.stockItemId}/movements`)
      .set(sessionRequestHeaders(cookie))
      .expect(200);
    expect(list.body.data.some((m: { movementType: string }) => m.movementType === "INITIAL_STOCK")).toBe(
      true,
    );
  });
});

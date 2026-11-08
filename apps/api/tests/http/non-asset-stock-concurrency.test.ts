import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";

describe("D09 — non-asset concurrency & idempotency", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  async function seedItem(app: ReturnType<typeof buildApplication>["app"], cookie: string, qty: number) {
    const ts = Date.now();
    const cat = await request(app)
      .post("/api/v1/asset-categories")
      .set(sessionRequestHeaders(cookie))
      .send({ categoryName: `D09-C-${ts}` })
      .expect(201);
    const created = await request(app)
      .post("/api/v1/non-asset-stock-items")
      .set(sessionRequestHeaders(cookie))
      .send({
        stockCode: `D09-CC-${ts}`,
        itemName: "Concurrency cable",
        categoryId: cat.body.data.categoryId,
        quantityOnHand: qty,
        unitOfMeasure: "FEET",
      })
      .expect(201);
    return created.body.data.stockItemId as string;
  }

  it("allows only one of two concurrent over-issue attempts", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const id = await seedItem(app, cookie, 10);
    const headers = sessionRequestHeaders(cookie);
    const body = { quantity: 8, department: "IT Stores" };

    const [a, b] = await Promise.all([
      request(app).post(`/api/v1/non-asset-stock-items/${id}/movements/issue`).set(headers).send(body),
      request(app).post(`/api/v1/non-asset-stock-items/${id}/movements/issue`).set(headers).send(body),
    ]);

    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([201, 422]);

    const row = await request(app)
      .get(`/api/v1/non-asset-stock-items/${id}`)
      .set(headers)
      .expect(200);
    const available = Number(row.body.data.quantityAvailable);
    expect(available).toBeGreaterThanOrEqual(0);
    expect(available).toBeLessThanOrEqual(10);
    expect(available).toBe(2);

    const movements = await request(app)
      .get(`/api/v1/non-asset-stock-items/${id}/movements`)
      .set(headers)
      .expect(200);
    const issueCount = movements.body.data.filter(
      (m: { movementType: string }) => m.movementType === "ISSUE",
    ).length;
    expect(issueCount).toBe(1);
  });

  it("parallel duplicate idempotency keys create exactly one issue movement", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const id = await seedItem(app, cookie, 50);
    const headers = sessionRequestHeaders(cookie);
    const key = randomUUID();
    const body = { quantity: 5, department: "Warehouse", idempotencyKey: key };

    const [a, b] = await Promise.all([
      request(app)
        .post(`/api/v1/non-asset-stock-items/${id}/movements/issue`)
        .set(headers)
        .send(body),
      request(app)
        .post(`/api/v1/non-asset-stock-items/${id}/movements/issue`)
        .set(headers)
        .send(body),
    ]);

    expect(a.status).toBe(201);
    expect(b.status).toBe(201);

    const movements = await request(app)
      .get(`/api/v1/non-asset-stock-items/${id}/movements`)
      .set(headers)
      .expect(200);
    const keyed = movements.body.data.filter(
      (m: { idempotencyKey: string | null }) => m.idempotencyKey === key,
    );
    expect(keyed.length).toBe(1);

    const row = await request(app)
      .get(`/api/v1/non-asset-stock-items/${id}`)
      .set(headers)
      .expect(200);
    expect(Number(row.body.data.quantityAvailable)).toBe(45);
  });
});

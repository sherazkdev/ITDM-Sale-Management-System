import request from "supertest";
import type { Express } from "express";
import { sessionRequestHeaders } from "./auth-test.js";

export async function createUsdBudgetAllocation(
  app: Express,
  cookie: string,
  ts: number,
  allocatedAmount = 100_000,
) {
  const year = await request(app)
    .post("/api/v1/financial-years")
    .set(sessionRequestHeaders(cookie))
    .send({
      yearName: `FY-${ts}`,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      status: "OPEN",
    })
    .expect(201);

  const alloc = await request(app)
    .post("/api/v1/budget-allocations")
    .set(sessionRequestHeaders(cookie))
    .send({
      financialYearId: year.body.data.financialYearId,
      budgetCategory: "IT Operations",
      allocatedAmount,
      currency: "USD",
    })
    .expect(201);

  return {
    budgetId: alloc.body.data.budgetId as string,
    financialYearId: year.body.data.financialYearId as string,
  };
}

export async function postInvoiceToBudget(
  app: Express,
  cookie: string,
  invoiceId: string,
  budgetId: string,
  commitmentExchangeRateToUsd?: number,
) {
  await request(app)
    .post(`/api/v1/invoices/${invoiceId}/post`)
    .set(sessionRequestHeaders(cookie))
    .send({
      budgetId,
      ...(commitmentExchangeRateToUsd !== undefined
        ? { commitmentExchangeRateToUsd }
        : {}),
    })
    .expect(200);
}

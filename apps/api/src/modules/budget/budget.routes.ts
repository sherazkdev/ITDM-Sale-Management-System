import { Router } from "express";
import { validateBody } from "../../shared/http/validate.js";
import { createAuthenticate, requirePermission } from "../../shared/middleware/auth.middleware.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import {
  appendLedgerEntrySchema,
  createBudgetAllocationSchema,
  createFinancialYearSchema,
} from "./budget.schema.js";
import type { BudgetController } from "./budget.controller.js";
import type { AuthService } from "../auth/auth.service.js";

export function createBudgetRouter(deps: {
  budgetController: BudgetController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);

  router.post(
    "/financial-years",
    authenticate,
    requirePermission(PermissionKeys.budgetsManage),
    validateBody(createFinancialYearSchema),
    deps.budgetController.createYear,
  );
  router.get(
    "/financial-years",
    authenticate,
    requirePermission(PermissionKeys.budgetsRead),
    deps.budgetController.listYears,
  );
  router.post(
    "/budget-allocations",
    authenticate,
    requirePermission(PermissionKeys.budgetsManage),
    validateBody(createBudgetAllocationSchema),
    deps.budgetController.createAllocation,
  );
  router.get(
    "/budget-allocations",
    authenticate,
    requirePermission(PermissionKeys.budgetsRead),
    deps.budgetController.listAllocations,
  );
  router.post(
    "/budget-ledger/entries",
    authenticate,
    requirePermission(PermissionKeys.budgetsManage),
    validateBody(appendLedgerEntrySchema),
    deps.budgetController.appendLedger,
  );
  router.get(
    "/budgets/:budgetId/summary",
    authenticate,
    requirePermission(PermissionKeys.budgetsRead),
    deps.budgetController.summary,
  );
  router.get(
    "/budgets/by-po/:id",
    authenticate,
    requirePermission(PermissionKeys.budgetsRead),
    deps.budgetController.byPurchaseOrder,
  );
  router.get(
    "/budgets/by-vendor/:id",
    authenticate,
    requirePermission(PermissionKeys.budgetsRead),
    deps.budgetController.byVendor,
  );
  return router;
}

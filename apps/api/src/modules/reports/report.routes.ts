import { Router } from "express";
import { createAuthenticate, requirePermission } from "../../shared/middleware/auth.middleware.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import type { ReportController } from "./report.controller.js";
import type { AuthService } from "../auth/auth.service.js";

export function createReportRouter(deps: {
  reportController: ReportController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);

  const read = [authenticate, requirePermission(PermissionKeys.reportsRead)] as const;

  router.get("/inventory", ...read, deps.reportController.inventory);
  router.get("/asset-register", ...read, deps.reportController.assetRegister);
  router.get("/budget-utilization", ...read, deps.reportController.budgetUtilization);
  router.get("/purchase-orders", ...read, deps.reportController.purchaseOrders);
  router.get("/contracts", ...read, deps.reportController.contracts);
  router.get("/invoices", ...read, deps.reportController.invoices);
  router.get("/asset-movements", ...read, deps.reportController.assetMovements);
  router.get("/employees", ...read, deps.reportController.employees);
  router.get("/non-asset-stock-ledger", ...read, deps.reportController.nonAssetStockLedger);
  return router;
}

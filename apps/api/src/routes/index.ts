import { Router } from "express";
import { createAuthRouter } from "../modules/auth/auth.routes.js";
import { createEmployeeRouter } from "../modules/employees/employee.routes.js";
import { createVendorRouter } from "../modules/vendors/vendor.routes.js";
import { createAssetCategoryRouter } from "../modules/asset-categories/asset-category.routes.js";
import { createAssetRouter } from "../modules/assets/asset.routes.js";
import { createContractRouter } from "../modules/contracts/contract.routes.js";
import { createPurchaseOrderRouter } from "../modules/purchase-orders/purchase-order.routes.js";
import { createAssetMovementRouter } from "../modules/asset-movements/asset-movement.routes.js";
import { createInvoiceRouter } from "../modules/invoices/invoice.routes.js";
import { createBudgetRouter } from "../modules/budget/budget.routes.js";
import { createSearchRouter } from "../modules/search/search.routes.js";
import { createMaintenanceRouter } from "../modules/maintenance/maintenance.routes.js";
import { createLicenseRouter } from "../modules/software-licenses/license.routes.js";
import { createDocumentRouter } from "../modules/documents/document.routes.js";
import {
  createInternalJobRouter,
  createNotificationRouter,
} from "../modules/notifications/notification.routes.js";
import { createAuditRouter } from "../modules/audit/audit.routes.js";
import { createReportRouter } from "../modules/reports/report.routes.js";
import { createUserAdminRouter } from "../modules/users/user.routes.js";
import { createHealthRouter } from "../modules/health/health.routes.js";
import { createNonAssetStockRouter } from "../modules/non-asset-stock/non-asset-stock.routes.js";
import { createDashboardRouter } from "../modules/dashboard/dashboard.routes.js";
import type { ApplicationControllers } from "../application/controllers.js";
import { createCsrfProtection } from "../shared/middleware/csrf.middleware.js";
import { createApiRateLimiter } from "../shared/middleware/api-rate-limit.js";

export function createApiRouter(controllers: ApplicationControllers): Router {
  const router = Router();
  router.use(createApiRateLimiter());
  router.use(createCsrfProtection());
  router.use("/health", createHealthRouter(controllers.healthController));
  router.use("/auth", createAuthRouter(controllers));
  router.use(
    "/non-asset-stock-items",
    createNonAssetStockRouter({
      nonAssetStockController: controllers.nonAssetStockController,
      authService: controllers.authService,
    }),
  );
  router.use(
    "/dashboard",
    createDashboardRouter({
      dashboardController: controllers.dashboardController,
      authService: controllers.authService,
    }),
  );
  router.use(
    "/employees",
    createEmployeeRouter({
      employeeController: controllers.employeeController,
      authService: controllers.authService,
    }),
  );
  router.use(
    "/vendors",
    createVendorRouter({
      vendorController: controllers.vendorController,
      authService: controllers.authService,
    }),
  );
  router.use(
    "/asset-categories",
    createAssetCategoryRouter({
      assetCategoryController: controllers.assetCategoryController,
      authService: controllers.authService,
    }),
  );
  router.use(
    "/assets",
    createAssetRouter({
      assetController: controllers.assetController,
      assetMovementController: controllers.assetMovementController,
      maintenanceController: controllers.maintenanceController,
      authService: controllers.authService,
    }),
  );
  router.use(
    "/contracts",
    createContractRouter({
      contractController: controllers.contractController,
      authService: controllers.authService,
    }),
  );
  router.use(
    "/purchase-orders",
    createPurchaseOrderRouter({
      purchaseOrderController: controllers.purchaseOrderController,
      invoiceController: controllers.invoiceController,
      authService: controllers.authService,
    }),
  );
  router.use(
    "/",
    createAssetMovementRouter({
      assetMovementController: controllers.assetMovementController,
      authService: controllers.authService,
    }),
  );
  router.use(
    "/invoices",
    createInvoiceRouter({
      invoiceController: controllers.invoiceController,
      authService: controllers.authService,
    }),
  );
  router.use(
    "/",
    createBudgetRouter({
      budgetController: controllers.budgetController,
      authService: controllers.authService,
    }),
  );
  router.use(
    "/search",
    createSearchRouter({
      searchController: controllers.searchController,
      authService: controllers.authService,
    }),
  );
  router.use(
    "/maintenance-records",
    createMaintenanceRouter({
      maintenanceController: controllers.maintenanceController,
      authService: controllers.authService,
    }),
  );
  router.use(
    "/software-licenses",
    createLicenseRouter({
      licenseController: controllers.licenseController,
      authService: controllers.authService,
    }),
  );
  router.use(
    "/documents",
    createDocumentRouter({
      documentController: controllers.documentController,
      authService: controllers.authService,
    }),
  );
  router.use(
    "/notifications",
    createNotificationRouter({
      notificationController: controllers.notificationController,
      authService: controllers.authService,
    }),
  );
  router.use(
    "/audit-events",
    createAuditRouter({
      auditController: controllers.auditController,
      authService: controllers.authService,
    }),
  );
  router.use(
    "/reports",
    createReportRouter({
      reportController: controllers.reportController,
      authService: controllers.authService,
    }),
  );
  router.use(
    "/users",
    createUserAdminRouter({
      userAdminController: controllers.userAdminController,
      authService: controllers.authService,
    }),
  );
  router.use(
    "/internal/jobs",
    createInternalJobRouter({
      notificationController: controllers.notificationController,
      authService: controllers.authService,
    }),
  );
  return router;
}

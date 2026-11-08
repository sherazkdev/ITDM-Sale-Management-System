import type { PrismaClient } from "@prisma/client";
import type { AppEnv } from "../shared/config/env.js";
import type { Logger } from "../shared/logging/logger.js";
import { AuditService } from "../shared/audit/audit.service.js";
import { PermissionService } from "../shared/auth/permission.service.js";
import { AuthRepository } from "../modules/auth/auth.repository.js";
import { AuthService } from "../modules/auth/auth.service.js";
import { AuthController } from "../modules/auth/auth.controller.js";
import { EmployeeRepository } from "../modules/employees/employee.repository.js";
import { EmployeeService } from "../modules/employees/employee.service.js";
import { EmployeeController } from "../modules/employees/employee.controller.js";
import { VendorRepository } from "../modules/vendors/vendor.repository.js";
import { VendorService } from "../modules/vendors/vendor.service.js";
import { VendorController } from "../modules/vendors/vendor.controller.js";
import { AssetCategoryRepository } from "../modules/asset-categories/asset-category.repository.js";
import { AssetCategoryService } from "../modules/asset-categories/asset-category.service.js";
import { AssetCategoryController } from "../modules/asset-categories/asset-category.controller.js";
import { AssetRepository } from "../modules/assets/asset.repository.js";
import { AssetService } from "../modules/assets/asset.service.js";
import { AssetController } from "../modules/assets/asset.controller.js";
import { ContractRepository } from "../modules/contracts/contract.repository.js";
import { ContractService } from "../modules/contracts/contract.service.js";
import { ContractController } from "../modules/contracts/contract.controller.js";
import { PurchaseOrderRepository } from "../modules/purchase-orders/purchase-order.repository.js";
import { PurchaseOrderService } from "../modules/purchase-orders/purchase-order.service.js";
import { PurchaseOrderController } from "../modules/purchase-orders/purchase-order.controller.js";
import { AssetMovementService } from "../modules/asset-movements/asset-movement.service.js";
import { AssetMovementController } from "../modules/asset-movements/asset-movement.controller.js";
import { InvoiceService } from "../modules/invoices/invoice.service.js";
import { InvoiceController } from "../modules/invoices/invoice.controller.js";
import { BudgetService } from "../modules/budget/budget.service.js";
import { BudgetController } from "../modules/budget/budget.controller.js";
import { SearchService } from "../modules/search/search.service.js";
import { SearchController } from "../modules/search/search.controller.js";
import { MaintenanceRepository } from "../modules/maintenance/maintenance.repository.js";
import { MaintenanceService } from "../modules/maintenance/maintenance.service.js";
import { MaintenanceController } from "../modules/maintenance/maintenance.controller.js";
import { LicenseService } from "../modules/software-licenses/license.service.js";
import { LicenseController } from "../modules/software-licenses/license.controller.js";
import { DocumentService } from "../modules/documents/document.service.js";
import { DocumentController } from "../modules/documents/document.controller.js";
import { NotificationService } from "../modules/notifications/notification.service.js";
import { NotificationController } from "../modules/notifications/notification.controller.js";
import { AuditController } from "../modules/audit/audit.controller.js";
import { ReportService } from "../modules/reports/report.service.js";
import { ReportController } from "../modules/reports/report.controller.js";
import { UserAdminService } from "../modules/users/user.service.js";
import { UserAdminController } from "../modules/users/user.controller.js";
import { HealthRepository } from "../modules/health/health.repository.js";
import { HealthService } from "../modules/health/health.service.js";
import { HealthController } from "../modules/health/health.controller.js";
import { DashboardService } from "../modules/dashboard/dashboard.service.js";
import { DashboardController } from "../modules/dashboard/dashboard.controller.js";
import { NonAssetStockRepository } from "../modules/non-asset-stock/non-asset-stock.repository.js";
import { NonAssetStockService } from "../modules/non-asset-stock/non-asset-stock.service.js";
import { NonAssetStockController } from "../modules/non-asset-stock/non-asset-stock.controller.js";

export type ApplicationControllers = {
  healthController: HealthController;
  authController: AuthController;
  employeeController: EmployeeController;
  vendorController: VendorController;
  assetCategoryController: AssetCategoryController;
  assetController: AssetController;
  contractController: ContractController;
  purchaseOrderController: PurchaseOrderController;
  assetMovementController: AssetMovementController;
  invoiceController: InvoiceController;
  budgetController: BudgetController;
  searchController: SearchController;
  maintenanceController: MaintenanceController;
  licenseController: LicenseController;
  documentController: DocumentController;
  notificationController: NotificationController;
  auditController: AuditController;
  reportController: ReportController;
  userAdminController: UserAdminController;
  dashboardController: DashboardController;
  nonAssetStockController: NonAssetStockController;
  authService: AuthService;
};

export function createApplicationControllers(
  prisma: PrismaClient,
  env: AppEnv,
  _logger: Logger,
): ApplicationControllers {
  const audit = new AuditService(prisma);
  const permissionService = new PermissionService(prisma);
  const authRepository = new AuthRepository(prisma);
  const authService = new AuthService(authRepository, permissionService);
  const authController = new AuthController(authService, env);

  const employeeRepository = new EmployeeRepository(prisma);
  const employeeService = new EmployeeService(employeeRepository);
  const employeeController = new EmployeeController(employeeService);

  const vendorRepository = new VendorRepository(prisma);
  const vendorService = new VendorService(vendorRepository);
  const vendorController = new VendorController(vendorService);

  const assetCategoryRepository = new AssetCategoryRepository(prisma);
  const assetCategoryService = new AssetCategoryService(assetCategoryRepository);
  const assetCategoryController = new AssetCategoryController(assetCategoryService);

  const assetRepository = new AssetRepository(prisma);
  const assetService = new AssetService(assetRepository, audit);
  const assetController = new AssetController(assetService);

  const contractRepository = new ContractRepository(prisma);
  const contractService = new ContractService(contractRepository, audit);
  const contractController = new ContractController(contractService);

  const purchaseOrderRepository = new PurchaseOrderRepository(prisma);
  const purchaseOrderService = new PurchaseOrderService(prisma, purchaseOrderRepository, audit);
  const purchaseOrderController = new PurchaseOrderController(purchaseOrderService);

  const assetMovementService = new AssetMovementService(prisma, audit);
  const assetMovementController = new AssetMovementController(assetMovementService);

  const invoiceService = new InvoiceService(prisma, audit);
  const invoiceController = new InvoiceController(invoiceService);

  const budgetService = new BudgetService(prisma, audit);
  const budgetController = new BudgetController(budgetService);

  const searchService = new SearchService(prisma);
  const searchController = new SearchController(searchService);

  const maintenanceRepository = new MaintenanceRepository(prisma);
  const maintenanceService = new MaintenanceService(prisma, maintenanceRepository, audit);
  const maintenanceController = new MaintenanceController(maintenanceService);

  const licenseService = new LicenseService(prisma, audit);
  const licenseController = new LicenseController(licenseService);

  const documentService = new DocumentService(prisma, audit, env);
  const documentController = new DocumentController(documentService);

  const notificationService = new NotificationService(prisma, env);
  const notificationController = new NotificationController(notificationService, env);

  const auditController = new AuditController(audit);

  const reportService = new ReportService(prisma, audit);
  const reportController = new ReportController(reportService);

  const userAdminService = new UserAdminService(prisma);
  const userAdminController = new UserAdminController(userAdminService);

  const healthRepository = new HealthRepository(prisma);
  const healthService = new HealthService(healthRepository);
  const healthController = new HealthController(healthService);

  const nonAssetStockRepository = new NonAssetStockRepository(prisma);
  const nonAssetStockService = new NonAssetStockService(nonAssetStockRepository, prisma, audit);
  const nonAssetStockController = new NonAssetStockController(nonAssetStockService);

  const dashboardService = new DashboardService(prisma, env.NOTIFICATION_LEAD_DAYS);
  const dashboardController = new DashboardController(dashboardService);

  return {
    healthController,
    authController,
    employeeController,
    vendorController,
    assetCategoryController,
    assetController,
    contractController,
    purchaseOrderController,
    assetMovementController,
    invoiceController,
    budgetController,
    searchController,
    maintenanceController,
    licenseController,
    documentController,
    notificationController,
    auditController,
    reportController,
    userAdminController,
    dashboardController,
    nonAssetStockController,
    authService,
  };
}

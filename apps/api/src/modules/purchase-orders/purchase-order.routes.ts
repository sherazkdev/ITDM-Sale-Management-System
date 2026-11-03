import { Router } from "express";
import { validateBody } from "../../shared/http/validate.js";
import { createAuthenticate, requirePermission } from "../../shared/middleware/auth.middleware.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import {
  createPurchaseOrderSchema,
  purchaseOrderLineSchema,
  updatePurchaseOrderSchema,
} from "./purchase-order.schema.js";
import type { PurchaseOrderController } from "./purchase-order.controller.js";
import type { InvoiceController } from "../invoices/invoice.controller.js";
import type { AuthService } from "../auth/auth.service.js";

export function createPurchaseOrderRouter(deps: {
  purchaseOrderController: PurchaseOrderController;
  invoiceController: InvoiceController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);

  router.use(authenticate);
  router.get("/", requirePermission(PermissionKeys.purchaseOrdersRead), deps.purchaseOrderController.list);
  router.post(
    "/",
    requirePermission(PermissionKeys.purchaseOrdersManage),
    validateBody(createPurchaseOrderSchema),
    deps.purchaseOrderController.create,
  );
  router.get(
    "/by-number/:poNumber",
    requirePermission(PermissionKeys.purchaseOrdersRead),
    deps.purchaseOrderController.getByNumber,
  );
  router.get(
    "/:id/invoices",
    requirePermission(PermissionKeys.invoicesRead),
    deps.invoiceController.listForPo,
  );
  router.get(
    "/:id",
    requirePermission(PermissionKeys.purchaseOrdersRead),
    deps.purchaseOrderController.getById,
  );
  router.patch(
    "/:id",
    requirePermission(PermissionKeys.purchaseOrdersManage),
    validateBody(updatePurchaseOrderSchema),
    deps.purchaseOrderController.update,
  );
  router.post(
    "/:id/lines",
    requirePermission(PermissionKeys.purchaseOrdersManage),
    validateBody(purchaseOrderLineSchema),
    deps.purchaseOrderController.addLine,
  );
  router.delete(
    "/:id/lines/:lineId",
    requirePermission(PermissionKeys.purchaseOrdersManage),
    deps.purchaseOrderController.removeLine,
  );
  router.post(
    "/:id/submit",
    requirePermission(PermissionKeys.purchaseOrdersManage),
    deps.purchaseOrderController.submit,
  );
  router.post(
    "/:id/approve",
    requirePermission(PermissionKeys.purchaseOrdersManage),
    deps.purchaseOrderController.approve,
  );
  router.post(
    "/:id/cancel",
    requirePermission(PermissionKeys.purchaseOrdersManage),
    deps.purchaseOrderController.cancel,
  );
  return router;
}

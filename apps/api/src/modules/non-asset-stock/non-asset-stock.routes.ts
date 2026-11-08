import { Router } from "express";
import { validateBody } from "../../shared/http/validate.js";
import { createAuthenticate, requirePermission } from "../../shared/middleware/auth.middleware.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import {
  createNonAssetStockItemSchema,
  nonAssetStockMovementBodySchema,
  nonAssetStockQuantityBodySchema,
  updateNonAssetStockItemSchema,
} from "./non-asset-stock.schema.js";
import type { NonAssetStockController } from "./non-asset-stock.controller.js";
import type { AuthService } from "../auth/auth.service.js";

export function createNonAssetStockRouter(deps: {
  nonAssetStockController: NonAssetStockController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);

  router.get("/", authenticate, requirePermission(PermissionKeys.assetsRead), deps.nonAssetStockController.list);
  router.post(
    "/",
    authenticate,
    requirePermission(PermissionKeys.assetsManage),
    validateBody(createNonAssetStockItemSchema),
    deps.nonAssetStockController.create,
  );
  router.get(
    "/:id",
    authenticate,
    requirePermission(PermissionKeys.assetsRead),
    deps.nonAssetStockController.getById,
  );
  router.patch(
    "/:id",
    authenticate,
    requirePermission(PermissionKeys.assetsManage),
    validateBody(updateNonAssetStockItemSchema),
    deps.nonAssetStockController.update,
  );
  router.get(
    "/:id/movements",
    authenticate,
    requirePermission(PermissionKeys.assetsRead),
    deps.nonAssetStockController.listMovements,
  );
  router.post(
    "/:id/movements/issue",
    authenticate,
    requirePermission(PermissionKeys.assetsManage),
    validateBody(nonAssetStockMovementBodySchema),
    deps.nonAssetStockController.issue,
  );
  router.post(
    "/:id/movements/return",
    authenticate,
    requirePermission(PermissionKeys.assetsManage),
    validateBody(nonAssetStockMovementBodySchema),
    deps.nonAssetStockController.returnStock,
  );
  router.post(
    "/:id/movements/replenish",
    authenticate,
    requirePermission(PermissionKeys.assetsManage),
    validateBody(nonAssetStockQuantityBodySchema),
    deps.nonAssetStockController.replenish,
  );
  router.post(
    "/:id/movements/write-off",
    authenticate,
    requirePermission(PermissionKeys.assetsManage),
    validateBody(nonAssetStockQuantityBodySchema),
    deps.nonAssetStockController.writeOff,
  );
  return router;
}

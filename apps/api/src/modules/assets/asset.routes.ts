import { Router } from "express";
import { validateBody } from "../../shared/http/validate.js";
import { createAuthenticate, requirePermission } from "../../shared/middleware/auth.middleware.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import { registerAssetSchema, updateAssetMetadataSchema } from "./asset.schema.js";
import type { AssetController } from "./asset.controller.js";
import type { AssetMovementController } from "../asset-movements/asset-movement.controller.js";
import type { AuthService } from "../auth/auth.service.js";
import type { MaintenanceController } from "../maintenance/maintenance.controller.js";

export function createAssetRouter(deps: {
  assetController: AssetController;
  assetMovementController: AssetMovementController;
  maintenanceController: MaintenanceController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);

  router.use(authenticate);
  router.get("/", requirePermission(PermissionKeys.assetsRead), deps.assetController.list);
  router.post(
    "/",
    requirePermission(PermissionKeys.assetsManage),
    validateBody(registerAssetSchema),
    deps.assetController.register,
  );
  router.get(
    "/:id/maintenance",
    requirePermission(PermissionKeys.maintenanceRead),
    deps.maintenanceController.listByAsset,
  );
  router.get(
    "/:id/current-holder",
    requirePermission(PermissionKeys.assetsRead),
    deps.assetMovementController.currentHolder,
  );
  router.get("/:id", requirePermission(PermissionKeys.assetsRead), deps.assetController.getById);
  router.get(
    "/:id/history",
    requirePermission(PermissionKeys.assetsRead),
    deps.assetController.history,
  );
  router.patch(
    "/:id",
    requirePermission(PermissionKeys.assetsManage),
    validateBody(updateAssetMetadataSchema),
    deps.assetController.updateMetadata,
  );
  router.post(
    "/:id/retire",
    requirePermission(PermissionKeys.assetsManage),
    deps.assetController.retire,
  );
  return router;
}

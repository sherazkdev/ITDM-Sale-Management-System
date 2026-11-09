import { Router } from "express";
import { validateBody } from "../../shared/http/validate.js";
import { createAuthenticate, requirePermission } from "../../shared/middleware/auth.middleware.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import {
  createAssetCategorySchema,
  updateAssetCategorySchema,
} from "./asset-category.schema.js";
import type { AssetCategoryController } from "./asset-category.controller.js";
import type { AuthService } from "../auth/auth.service.js";

export function createAssetCategoryRouter(deps: {
  assetCategoryController: AssetCategoryController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);

  router.use(authenticate);
  router.get(
    "/",
    requirePermission(PermissionKeys.assetsRead),
    deps.assetCategoryController.list,
  );
  router.get("/export", requirePermission(PermissionKeys.assetsRead), deps.assetCategoryController.exportList);
  router.post(
    "/import/preview",
    requirePermission(PermissionKeys.assetsManage),
    ...deps.assetCategoryController.importPreviewSpreadsheet,
  );
  router.post(
    "/import",
    requirePermission(PermissionKeys.assetsManage),
    ...deps.assetCategoryController.importSpreadsheet,
  );
  router.post(
    "/",
    requirePermission(PermissionKeys.assetsManage),
    validateBody(createAssetCategorySchema),
    deps.assetCategoryController.create,
  );
  router.patch(
    "/:id",
    requirePermission(PermissionKeys.assetsManage),
    validateBody(updateAssetCategorySchema),
    deps.assetCategoryController.update,
  );
  return router;
}

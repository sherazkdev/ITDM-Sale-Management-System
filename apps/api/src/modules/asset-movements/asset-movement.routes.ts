import { Router } from "express";
import { validateBody } from "../../shared/http/validate.js";
import { createAuthenticate, requirePermission } from "../../shared/middleware/auth.middleware.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import { issueAssetsSchema, returnAssetsSchema } from "./asset-movement.schema.js";
import type { AssetMovementController } from "./asset-movement.controller.js";
import type { AuthService } from "../auth/auth.service.js";

export function createAssetMovementRouter(deps: {
  assetMovementController: AssetMovementController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);

  router.post(
    "/asset-issuances",
    authenticate,
    requirePermission(PermissionKeys.assetsIssue),
    validateBody(issueAssetsSchema),
    deps.assetMovementController.issue,
  );
  router.get(
    "/asset-issuances/:documentId",
    authenticate,
    requirePermission(PermissionKeys.assetsRead),
    deps.assetMovementController.getIssuance,
  );
  router.post(
    "/asset-returns",
    authenticate,
    requirePermission(PermissionKeys.assetsReturn),
    validateBody(returnAssetsSchema),
    deps.assetMovementController.returnAssets,
  );
  router.get(
    "/asset-returns/:documentId",
    authenticate,
    requirePermission(PermissionKeys.assetsRead),
    deps.assetMovementController.getReturn,
  );
  return router;
}

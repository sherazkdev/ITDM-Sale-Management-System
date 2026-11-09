import { Router } from "express";
import { validateBody } from "../../shared/http/validate.js";
import { createAuthenticate, requirePermission } from "../../shared/middleware/auth.middleware.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import { createVendorSchema, updateVendorSchema } from "./vendor.schema.js";
import type { VendorController } from "./vendor.controller.js";
import type { AuthService } from "../auth/auth.service.js";

export function createVendorRouter(deps: {
  vendorController: VendorController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);

  router.use(authenticate);
  router.get("/", requirePermission(PermissionKeys.vendorsRead), deps.vendorController.list);
  router.post(
    "/",
    requirePermission(PermissionKeys.vendorsManage),
    validateBody(createVendorSchema),
    deps.vendorController.create,
  );
  router.get("/export", requirePermission(PermissionKeys.vendorsRead), deps.vendorController.exportList);
  router.post(
    "/import/preview",
    requirePermission(PermissionKeys.vendorsManage),
    ...deps.vendorController.importPreviewSpreadsheet,
  );
  router.post(
    "/import",
    requirePermission(PermissionKeys.vendorsManage),
    ...deps.vendorController.importSpreadsheet,
  );
  router.get("/:id", requirePermission(PermissionKeys.vendorsRead), deps.vendorController.getById);
  router.patch(
    "/:id",
    requirePermission(PermissionKeys.vendorsManage),
    validateBody(updateVendorSchema),
    deps.vendorController.update,
  );
  router.post(
    "/:id/archive",
    requirePermission(PermissionKeys.vendorsManage),
    deps.vendorController.archive,
  );
  return router;
}

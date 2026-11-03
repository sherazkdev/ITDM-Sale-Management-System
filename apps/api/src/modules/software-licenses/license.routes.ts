import { Router } from "express";
import { validateBody } from "../../shared/http/validate.js";
import { createAuthenticate, requirePermission } from "../../shared/middleware/auth.middleware.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import { createLicenseSchema, updateLicenseSchema } from "./license.schema.js";
import type { LicenseController } from "./license.controller.js";
import type { AuthService } from "../auth/auth.service.js";

export function createLicenseRouter(deps: {
  licenseController: LicenseController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);

  router.use(authenticate);
  router.get("/", requirePermission(PermissionKeys.licensesRead), deps.licenseController.list);
  router.post(
    "/",
    requirePermission(PermissionKeys.licensesManage),
    validateBody(createLicenseSchema),
    deps.licenseController.create,
  );
  router.get("/:id", requirePermission(PermissionKeys.licensesRead), deps.licenseController.getById);
  router.patch(
    "/:id",
    requirePermission(PermissionKeys.licensesManage),
    validateBody(updateLicenseSchema),
    deps.licenseController.update,
  );
  router.post(
    "/:id/renew",
    requirePermission(PermissionKeys.licensesManage),
    deps.licenseController.renew,
  );
  return router;
}

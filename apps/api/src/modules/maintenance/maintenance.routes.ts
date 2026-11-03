import { Router } from "express";
import { validateBody } from "../../shared/http/validate.js";
import { createAuthenticate, requirePermission } from "../../shared/middleware/auth.middleware.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import {
  completeMaintenanceSchema,
  createMaintenanceSchema,
  updateMaintenanceSchema,
} from "./maintenance.schema.js";
import type { MaintenanceController } from "./maintenance.controller.js";
import type { AuthService } from "../auth/auth.service.js";

export function createMaintenanceRouter(deps: {
  maintenanceController: MaintenanceController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);

  router.use(authenticate);
  router.get("/", requirePermission(PermissionKeys.maintenanceRead), deps.maintenanceController.list);
  router.post(
    "/",
    requirePermission(PermissionKeys.maintenanceManage),
    validateBody(createMaintenanceSchema),
    deps.maintenanceController.create,
  );
  router.get("/:id", requirePermission(PermissionKeys.maintenanceRead), deps.maintenanceController.getById);
  router.patch(
    "/:id",
    requirePermission(PermissionKeys.maintenanceManage),
    validateBody(updateMaintenanceSchema),
    deps.maintenanceController.update,
  );
  router.post(
    "/:id/complete",
    requirePermission(PermissionKeys.maintenanceManage),
    validateBody(completeMaintenanceSchema),
    deps.maintenanceController.complete,
  );
  return router;
}

import { Router } from "express";
import { validateBody } from "../../shared/http/validate.js";
import { createAuthenticate, requirePermission } from "../../shared/middleware/auth.middleware.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import { createEmployeeSchema, updateEmployeeSchema } from "./employee.schema.js";
import type { EmployeeController } from "./employee.controller.js";
import type { AuthService } from "../auth/auth.service.js";

export function createEmployeeRouter(deps: {
  employeeController: EmployeeController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);

  router.use(authenticate);
  router.get("/", requirePermission(PermissionKeys.employeesRead), deps.employeeController.list);
  router.post(
    "/",
    requirePermission(PermissionKeys.employeesWrite),
    validateBody(createEmployeeSchema),
    deps.employeeController.create,
  );
  router.post(
    "/import/preview",
    requirePermission(PermissionKeys.employeesWrite),
    ...deps.employeeController.importPreviewSpreadsheet,
  );
  router.post(
    "/import",
    requirePermission(PermissionKeys.employeesWrite),
    ...deps.employeeController.importSpreadsheet,
  );
  router.get("/:id", requirePermission(PermissionKeys.employeesRead), deps.employeeController.getById);
  router.patch(
    "/:id",
    requirePermission(PermissionKeys.employeesWrite),
    validateBody(updateEmployeeSchema),
    deps.employeeController.update,
  );
  router.post(
    "/:id/deactivate",
    requirePermission(PermissionKeys.employeesWrite),
    deps.employeeController.deactivate,
  );
  return router;
}

import { Router } from "express";
import { validateBody } from "../../shared/http/validate.js";
import { createAuthenticate, requirePermission } from "../../shared/middleware/auth.middleware.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import { createDepartmentSchema, updateDepartmentSchema } from "./department.schema.js";
import type { DepartmentController } from "./department.controller.js";
import type { AuthService } from "../auth/auth.service.js";

export function createDepartmentRouter(deps: {
  departmentController: DepartmentController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);
  const read = [authenticate, requirePermission(PermissionKeys.departmentsRead)] as const;
  const manage = [authenticate, requirePermission(PermissionKeys.departmentsManage)] as const;

  router.get("/", ...read, deps.departmentController.list);
  router.get("/export", ...read, deps.departmentController.exportList);
  router.get("/:id", ...read, deps.departmentController.getById);
  router.post("/", ...manage, validateBody(createDepartmentSchema), deps.departmentController.create);
  router.patch(
    "/:id",
    ...manage,
    validateBody(updateDepartmentSchema),
    deps.departmentController.update,
  );
  router.post("/import/preview", ...manage, ...deps.departmentController.importPreviewSpreadsheet);
  router.post("/import", ...manage, ...deps.departmentController.importSpreadsheet);
  return router;
}

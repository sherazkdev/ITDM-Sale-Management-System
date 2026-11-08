import { Router } from "express";
import { validateBody } from "../../shared/http/validate.js";
import { createAuthenticate, requirePermission } from "../../shared/middleware/auth.middleware.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import {
  createRoleSchema,
  setRolePermissionsSchema,
  updateRoleSchema,
} from "./role-admin.schema.js";
import type { RoleAdminController } from "./role-admin.controller.js";
import type { AuthService } from "../auth/auth.service.js";

export function createRoleAdminRouter(deps: {
  roleAdminController: RoleAdminController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);
  const manage = [authenticate, requirePermission(PermissionKeys.rolesManage)] as const;

  router.get("/permissions/catalog", ...manage, deps.roleAdminController.listPermissions);
  router.get("/", ...manage, deps.roleAdminController.listRoles);
  router.post("/", ...manage, validateBody(createRoleSchema), deps.roleAdminController.create);
  router.patch(
    "/:id",
    ...manage,
    validateBody(updateRoleSchema),
    deps.roleAdminController.update,
  );
  router.put(
    "/:id/permissions",
    ...manage,
    validateBody(setRolePermissionsSchema),
    deps.roleAdminController.setPermissions,
  );
  router.delete("/:id", ...manage, deps.roleAdminController.remove);
  return router;
}

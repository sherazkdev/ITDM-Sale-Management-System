import { Router } from "express";
import { validateBody } from "../../shared/http/validate.js";
import { createAuthenticate, requirePermission } from "../../shared/middleware/auth.middleware.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import { createUserSchema, setUserRolesSchema, updateUserSchema } from "./user.schema.js";
import type { UserAdminController } from "./user.controller.js";
import type { AuthService } from "../auth/auth.service.js";

export function createUserAdminRouter(deps: {
  userAdminController: UserAdminController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);
  const manage = [authenticate, requirePermission(PermissionKeys.usersManage)] as const;

  router.get("/roles", ...manage, deps.userAdminController.listRoles);
  router.get("/", ...manage, deps.userAdminController.list);
  router.post("/", ...manage, validateBody(createUserSchema), deps.userAdminController.create);
  router.patch(
    "/:id",
    ...manage,
    validateBody(updateUserSchema),
    deps.userAdminController.update,
  );
  router.put(
    "/:id/roles",
    ...manage,
    validateBody(setUserRolesSchema),
    deps.userAdminController.setRoles,
  );
  return router;
}

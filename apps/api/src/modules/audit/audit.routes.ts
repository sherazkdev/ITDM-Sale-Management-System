import { Router } from "express";
import { createAuthenticate, requirePermission } from "../../shared/middleware/auth.middleware.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import type { AuditController } from "./audit.controller.js";
import type { AuthService } from "../auth/auth.service.js";

export function createAuditRouter(deps: {
  auditController: AuditController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);

  router.get(
    "/",
    authenticate,
    requirePermission(PermissionKeys.auditRead),
    deps.auditController.list,
  );
  router.get(
    "/:id",
    authenticate,
    requirePermission(PermissionKeys.auditRead),
    deps.auditController.getById,
  );
  return router;
}

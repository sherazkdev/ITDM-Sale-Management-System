import { Router } from "express";
import { createAuthenticate, requirePermission } from "../../shared/middleware/auth.middleware.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import type { NotificationController } from "./notification.controller.js";
import type { AuthService } from "../auth/auth.service.js";

export function createNotificationRouter(deps: {
  notificationController: NotificationController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);

  router.get(
    "/",
    authenticate,
    requirePermission(PermissionKeys.notificationsRead),
    deps.notificationController.list,
  );
  router.get(
    "/unread-count",
    authenticate,
    requirePermission(PermissionKeys.notificationsRead),
    deps.notificationController.unreadCount,
  );
  router.post(
    "/:id/read",
    authenticate,
    requirePermission(PermissionKeys.notificationsRead),
    deps.notificationController.markRead,
  );
  return router;
}

export function createInternalJobRouter(deps: {
  notificationController: NotificationController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);
  router.post(
    "/expiry/run",
    authenticate,
    requirePermission(PermissionKeys.jobsRun),
    deps.notificationController.runExpiryJob,
  );
  return router;
}

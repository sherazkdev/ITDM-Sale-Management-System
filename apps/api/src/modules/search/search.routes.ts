import { Router } from "express";
import { createAuthenticate, requirePermission } from "../../shared/middleware/auth.middleware.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import type { SearchController } from "./search.controller.js";
import type { AuthService } from "../auth/auth.service.js";

export function createSearchRouter(deps: {
  searchController: SearchController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);

  router.get(
    "/purchase-orders/:poNumber",
    authenticate,
    requirePermission(PermissionKeys.searchRead),
    deps.searchController.byPoNumber,
  );
  return router;
}

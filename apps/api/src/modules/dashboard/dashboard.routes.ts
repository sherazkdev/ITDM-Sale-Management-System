import { Router } from "express";
import { createAuthenticate } from "../../shared/middleware/auth.middleware.js";
import type { AuthService } from "../auth/auth.service.js";
import type { DashboardController } from "./dashboard.controller.js";

export function createDashboardRouter(deps: {
  dashboardController: DashboardController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);

  router.get("/summary", authenticate, deps.dashboardController.summary);
  return router;
}

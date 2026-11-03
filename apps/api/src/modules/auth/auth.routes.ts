import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validateBody } from "../../shared/http/validate.js";
import { createAuthenticate } from "../../shared/middleware/auth.middleware.js";
import { loginBodySchema } from "./auth.schema.js";
import type { AuthController } from "./auth.controller.js";
import type { AuthService } from "./auth.service.js";

export function createAuthRouter(deps: {
  authController: AuthController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    /** Production: brute-force protection. Non-production: headroom for E2E/QA (never use NODE_ENV=production locally for QA). */
    max: process.env.NODE_ENV === "production" ? 30 : 200,
    standardHeaders: true,
    legacyHeaders: false,
  });

  router.post("/login", loginLimiter, validateBody(loginBodySchema), deps.authController.login);
  router.post("/logout", authenticate, deps.authController.logout);
  router.get("/me", authenticate, deps.authController.me);
  return router;
}

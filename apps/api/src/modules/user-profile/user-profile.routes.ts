import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validateBody } from "../../shared/http/validate.js";
import { createAuthenticate } from "../../shared/middleware/auth.middleware.js";
import { changePasswordSchema, updateProfileSchema } from "./user-profile.schema.js";
import type { UserProfileController } from "./user-profile.controller.js";
import type { AuthService } from "../auth/auth.service.js";

export function createUserProfileRouter(deps: {
  userProfileController: UserProfileController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);
  const passwordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "production" ? 10 : 50,
    standardHeaders: true,
    legacyHeaders: false,
  });

  router.get("/me", authenticate, deps.userProfileController.getMe);
  router.patch("/me", authenticate, validateBody(updateProfileSchema), deps.userProfileController.patchMe);
  const changePasswordHandlers = [
    authenticate,
    passwordLimiter,
    validateBody(changePasswordSchema),
    deps.userProfileController.changePassword,
  ];
  router.put("/me/password", ...changePasswordHandlers);
  router.post("/me/password", ...changePasswordHandlers);
  router.get("/me/avatar", authenticate, deps.userProfileController.getAvatar);
  router.post("/me/avatar", authenticate, ...deps.userProfileController.uploadAvatar);
  return router;
}

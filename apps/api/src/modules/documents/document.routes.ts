import { Router } from "express";
import { validateBody } from "../../shared/http/validate.js";
import { createAuthenticate, requirePermission } from "../../shared/middleware/auth.middleware.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import { uploadDocumentSchema } from "./document.schema.js";
import type { DocumentController } from "./document.controller.js";
import type { AuthService } from "../auth/auth.service.js";

export function createDocumentRouter(deps: {
  documentController: DocumentController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);

  router.post(
    "/uploads",
    authenticate,
    requirePermission(PermissionKeys.documentsManage),
    validateBody(uploadDocumentSchema),
    deps.documentController.upload,
  );
  router.get(
    "/:id/metadata",
    authenticate,
    requirePermission(PermissionKeys.documentsRead),
    deps.documentController.metadata,
  );
  router.get(
    "/:id/download",
    authenticate,
    requirePermission(PermissionKeys.documentsRead),
    deps.documentController.download,
  );
  router.post(
    "/issuance-documents/:id/generate",
    authenticate,
    requirePermission(PermissionKeys.documentsRead),
    deps.documentController.generateIssuance,
  );
  router.post(
    "/return-documents/:id/generate",
    authenticate,
    requirePermission(PermissionKeys.documentsRead),
    deps.documentController.generateIssuance,
  );
  return router;
}

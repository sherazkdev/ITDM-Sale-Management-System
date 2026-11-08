import { Router } from "express";
import { validateBody } from "../../shared/http/validate.js";
import {
  createAuthenticate,
  requireFinancialCorrections,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import { createInvoiceSchema, postInvoiceSchema, recordPaymentSchema } from "./invoice.schema.js";
import { correctDraftInvoiceSchema } from "../financial-corrections/financial-correction.schema.js";
import type { InvoiceController } from "./invoice.controller.js";
import type { AuthService } from "../auth/auth.service.js";

export function createInvoiceRouter(deps: {
  invoiceController: InvoiceController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);

  router.use(authenticate);
  router.get("/", requirePermission(PermissionKeys.invoicesRead), deps.invoiceController.list);
  router.post(
    "/",
    requirePermission(PermissionKeys.invoicesManage),
    validateBody(createInvoiceSchema),
    deps.invoiceController.create,
  );
  router.get("/:id", requirePermission(PermissionKeys.invoicesRead), deps.invoiceController.getById);
  router.get("/:id/balance", requirePermission(PermissionKeys.invoicesRead), deps.invoiceController.balance);
  router.post(
    "/:id/post",
    requirePermission(PermissionKeys.invoicesManage),
    validateBody(postInvoiceSchema),
    deps.invoiceController.post,
  );
  router.get(
    "/:id/payments",
    requirePermission(PermissionKeys.invoicesRead),
    deps.invoiceController.listPayments,
  );
  router.post(
    "/:id/payments",
    requirePermission(PermissionKeys.invoicesManage),
    validateBody(recordPaymentSchema),
    deps.invoiceController.recordPayment,
  );
  router.patch(
    "/:id/corrections",
    requireFinancialCorrections(),
    validateBody(correctDraftInvoiceSchema),
    deps.invoiceController.correctDraft,
  );
  return router;
}

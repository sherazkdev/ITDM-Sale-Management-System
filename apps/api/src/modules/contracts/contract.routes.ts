import { Router } from "express";
import { validateBody } from "../../shared/http/validate.js";
import { createAuthenticate, requirePermission } from "../../shared/middleware/auth.middleware.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import { createContractSchema, updateContractSchema } from "./contract.schema.js";
import type { ContractController } from "./contract.controller.js";
import type { AuthService } from "../auth/auth.service.js";

export function createContractRouter(deps: {
  contractController: ContractController;
  authService: AuthService;
}): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.authService);

  router.use(authenticate);
  router.get("/", requirePermission(PermissionKeys.contractsRead), deps.contractController.list);
  router.post(
    "/",
    requirePermission(PermissionKeys.contractsManage),
    validateBody(createContractSchema),
    deps.contractController.create,
  );
  router.get("/:id", requirePermission(PermissionKeys.contractsRead), deps.contractController.getById);
  router.patch(
    "/:id",
    requirePermission(PermissionKeys.contractsManage),
    validateBody(updateContractSchema),
    deps.contractController.update,
  );
  router.get(
    "/:id/purchase-orders",
    requirePermission(PermissionKeys.contractsRead),
    deps.contractController.listPurchaseOrders,
  );
  return router;
}

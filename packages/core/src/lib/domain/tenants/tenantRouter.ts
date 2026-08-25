import { Router } from "express";
import { tenantController } from "./controller";

export function tenantRouter(): Router {
  const router = Router();
  const tenantsCtrl = tenantController();

  router.use("/values", tenantsCtrl);

  return router;
}
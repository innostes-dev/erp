import { Router } from "express";
import { tenantController } from "./controller";

export function tenantRouter(): Router {
  const router = Router();
  const tenantsCtrl = tenantController();

  router.post("/create", tenantsCtrl.createTenant);
  router.get("/getAll", tenantsCtrl.getTenants);
  router.put("/update/:id", tenantsCtrl.updateTenant);
  router.delete("/delete/:id", tenantsCtrl.deleteTenant); 
  return router;
}
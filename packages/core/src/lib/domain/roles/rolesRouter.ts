import { Router } from "express";
import { rolesController } from "./controller";

export function rolesRouter(): Router {
  const router = Router();
  const rolesCtrl = rolesController();

  router.post("/create", rolesCtrl.createRole);
  router.get("/getAll", rolesCtrl.getRoles);
  router.put("/update/:id", rolesCtrl.updateRole);
  router.delete("/delete/:id", rolesCtrl.deleteRole); 

  return router;
}
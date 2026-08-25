import { Router } from "express";
import { rolesController } from "./controller";

export function rolesRouter(): Router {
  const router = Router();
  const rolesCtrl = rolesController();

  router.use("/values", rolesCtrl);

  return router;
}
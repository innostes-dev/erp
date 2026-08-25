import { Router } from "express";
import { ipReputationController } from "./controller";

export function ipReputationRouter(): Router {
  const router = Router();
  const ipReputationCtrl = ipReputationController();

  router.use("/values", ipReputationCtrl);

  return router;
}
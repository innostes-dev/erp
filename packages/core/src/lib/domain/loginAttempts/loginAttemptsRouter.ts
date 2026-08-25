import { Router } from "express";
import { loginAttemptsController } from "./controller";

export function loginAttemptsRouter(): Router {
  const router = Router();
  const loginAttemptsCtrl = loginAttemptsController();

  router.use("/values", loginAttemptsCtrl);

  return router;
}
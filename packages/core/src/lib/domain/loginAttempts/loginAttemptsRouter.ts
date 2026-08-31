import { Router } from "express";
import { loginAttemptsController } from "./controller";

export function loginAttemptsRouter(): Router {
  const router = Router();
  const loginAttemptsCtrl = loginAttemptsController();

  router.post("/create", loginAttemptsCtrl.createloginAttempts);
  router.get("/getAll", loginAttemptsCtrl.getloginAttempts); 

  return router;
}
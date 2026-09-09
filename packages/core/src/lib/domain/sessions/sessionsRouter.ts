import { Router } from "express";
import { sessionsController } from "./controllers";

export function sessionsRouter(): Router {
  const router = Router();
  const sessionsCtrl = sessionsController();

  router.post("/create", sessionsCtrl.createSession);

  return router;
}

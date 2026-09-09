import { Router } from "express";
import { auditlogController } from "./controller";

export function auditlogRouter(): Router {
  const router = Router();
  const auditlogctrl = auditlogController();

  router.post("/create", auditlogctrl.createAuditLog);
  router.get("/get/:id", auditlogctrl.getAuditLog); 

  return router;
}
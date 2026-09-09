import { Router } from "express";
import { devicesController } from "./controllers";

export function devicesRouter(): Router {
  const router = Router();
  const devicesCtrl = devicesController();

  router.post("/create", devicesCtrl.createDevice);
  router.get("/getAll", devicesCtrl.getDevices);

  return router;
}

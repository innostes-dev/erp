import { Router } from "express";
import { userCredentialsController } from "./controllers";

export function userCredentialsRouter(): Router {
  const router = Router();
  const userCredentialsCtrl = userCredentialsController();

  router.post("/create", userCredentialsCtrl.createUserCredentials);
  router.get("/getAll", userCredentialsCtrl.getUserCredentials);
  router.put("/update/:id", userCredentialsCtrl.updateUserCredentials);

  return router;
}

import { Router } from "express";
import { userSecurityController } from "./controllers";

export function userSecurityRouter(): Router {
  const router = Router();
  const userSecurityCtrl = userSecurityController();

  router.post("/create", userSecurityCtrl.createUserSecurity);
  router.put("/update/:user_id", userSecurityCtrl.updateUserSecurity);

  return router;
}

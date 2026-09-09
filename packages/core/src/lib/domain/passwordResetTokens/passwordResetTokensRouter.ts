import { Router } from "express";
import { passwordResetTokensController } from "./controllers";

export function passwordResetTokensRouter(): Router {
  const router = Router();
  const passwordResetTokensCtrl = passwordResetTokensController();

  router.post("/create", passwordResetTokensCtrl.createPasswordResetToken);
  router.put("/update/:id", passwordResetTokensCtrl.updatePasswordResetToken);

  return router;
}

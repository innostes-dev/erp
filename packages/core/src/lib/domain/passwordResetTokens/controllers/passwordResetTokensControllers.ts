import { Request, Response } from "express";
import { passwordResetTokensServices } from "../services/passwordResetTokensServices";

export function passwordResetTokensController() {
  const createPasswordResetToken = async (req: Request, res: Response) => {
    try {
      const result = await passwordResetTokensServices().createPasswordResetToken(req.body);
      return res.status(201).json(result);
    } catch (error) {
      console.error("Error creating password reset token:", error);
      return res.status(500).json({
        message: "Failed to create password reset token",
      });
    }
  };

  const updatePasswordResetToken = async (req: Request, res: Response) => {
    try {
      const result = await passwordResetTokensServices().updatePasswordResetToken(req.params["id"], req.body);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error updating password reset token:", error);
      return res.status(500).json({
        message: "Failed to update password reset token",
      });
    }
  };

  return {
    createPasswordResetToken,
    updatePasswordResetToken,
  };
}

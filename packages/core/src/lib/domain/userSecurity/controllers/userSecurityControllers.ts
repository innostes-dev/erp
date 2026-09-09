import { Request, Response } from "express";
import { userSecurityServices } from "../services/userSecurityServices";

export function userSecurityController() {
  const createUserSecurity = async (req: Request, res: Response) => {
    try {
      const result = await userSecurityServices().createUserSecurity(req.body);
      return res.status(201).json(result);
    } catch (error) {
      console.error("Error creating user security:", error);
      return res.status(500).json({
        message: "Failed to create user security",
      });
    }
  };

  const updateUserSecurity = async (req: Request, res: Response) => {
    try {
      const result = await userSecurityServices().updateUserSecurity(req.params["user_id"], req.body);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error updating user security:", error);
      return res.status(500).json({
        message: "Failed to update user security",
      });
    }
  };

  return {
    createUserSecurity,
    updateUserSecurity,
  };
}

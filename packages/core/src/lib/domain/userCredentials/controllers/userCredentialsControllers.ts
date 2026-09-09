import { Request, Response } from "express";
import { userCredentialsServices } from "../services/userCredentialsServices";

export function userCredentialsController() {
  const createUserCredentials = async (req: Request, res: Response) => {
    try {
      const result = await userCredentialsServices().createUserCredentials(req.body);
      return res.status(201).json(result);
    } catch (error) {
      console.error("Error creating user credentials:", error);
      return res.status(500).json({ message: "Failed to create user credentials" });
    }
  };

  const getUserCredentials = async (req: Request, res: Response) => {
    try {
      const result = await userCredentialsServices().getUserCredentials();
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching user credentials:", error);
      return res.status(500).json({ message: "Failed to fetch user credentials" });
    }
  };

  const updateUserCredentials = async (req: Request, res: Response) => {
    try {
      const result = await userCredentialsServices().updateUserCredentials(req.params["id"], req.body);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error updating user credentials:", error);
      return res.status(500).json({ message: "Failed to update user credentials" });
    }
  };

  return {
    createUserCredentials,
    getUserCredentials,
    updateUserCredentials,
  };
}

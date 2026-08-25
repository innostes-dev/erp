import { Router, Request, Response } from "express";
import { loginAttemptsServices } from "../services/loginAttemptsServices";

export function loginAttemptsController(): Router {
  const router = Router();

  const createloginAttempts = async (req: Request, res: Response) => {
    try {
      const result = await loginAttemptsServices().createloginAttempts(req.body);
      return res.status(201).json(result);
    } catch (error) {
      console.error("Error creating loginAttempts:", error);
      return res.status(500).json({
        message: "Failed to create loginAttempts",
      });
    }
  };

  const getloginAttempts = async (req: Request, res: Response) => {
    try {
      const result = await loginAttemptsServices().getloginAttempts();
      return res.status(200).json(result);
    }
    catch (error) {
      console.error("Error fetching loginAttempts:", error);
      return res.status(500).json({
        message: "Failed to fetch loginAttempts",
        });
    }
  } 
  router.post("/create", createloginAttempts);
  router.get("/getAll", getloginAttempts); 
  return router;
}
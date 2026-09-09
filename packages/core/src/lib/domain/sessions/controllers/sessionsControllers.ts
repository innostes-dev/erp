import { Request, Response } from "express";
import { sessionsServices } from "../services/sessionsServices";

export function sessionsController() {
  const createSession = async (req: Request, res: Response) => {
    try {
      const result = await sessionsServices().createSession(req.body);
      return res.status(201).json(result);
    } catch (error) {
      console.error("Error creating session:", error);
      return res.status(500).json({
        message: "Failed to create session",
      });
    }
  };

  return {
    createSession,
  };
}

import {  Request, Response } from "express";
import {userSecurityServices} from "../services"

export function userController(){
  
  const createUserSecurity = async (req: Request, res: Response) => {
    try {
      const result = await userSecurityServices().createUserSecurity(req.body);
      return res.status(201).json(result);
    } catch (error) {
      console.error("Error creating userSecurity:", error);
      return res.status(500).json({
        message: "Failed to create userSecurity",
      });
    }
  };
  
  return{
    createUserSecurity
  }

}
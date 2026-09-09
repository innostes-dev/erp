import {  Request, Response } from "express";
import {usersServices} from "../services"

export function userController(){
  
  const createUsers = async (req: Request, res: Response) => {
    try {
      const result = await usersServices().createUsers(req.body);
      return res.status(201).json(result);
    } catch (error) {
      console.error("Error creating users:", error);
      return res.status(500).json({
        message: "Failed to create users",
      });
    }
  };
  
  return{
    createUsers
  }

}
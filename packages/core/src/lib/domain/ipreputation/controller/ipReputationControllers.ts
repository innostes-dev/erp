import {  Request, Response } from "express";
import { ipReputationServices } from "../services/ipReputationServices";

export function ipReputationController(){
  
  const createIpReputation = async (req: Request, res: Response) => {
    try {
      const result = await ipReputationServices().createIpReputation(req.body);
      return res.status(201).json(result);
    } catch (error) {
      console.error("Error creating ipReputation:", error);
      return res.status(500).json({
        message: "Failed to create ipReputation",
      });
    }
  };
  
  return{
    createIpReputation
  }

}
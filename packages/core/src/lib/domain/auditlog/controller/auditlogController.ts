import {  Request, Response } from "express";
import { auditlogServices } from "../services";

export function auditlogController() {

  const createAuditLog = async (req: Request, res: Response) => {
    try {
      const result = await auditlogServices().createAuditLog(req.body);
      return res.status(201).json(result);
    } catch (error) {
      console.error("Error creating Auditlog:", error);
      return res.status(500).json({
        message: "Failed to create auditlog",
      });
    }
  };

  const getAuditLog = async (req: Request, res: Response) => {
    try {
      const result = await auditlogServices().getAuditLog(req.params['id']);
      return res.status(200).json(result);
    }
    catch (error) {
      console.error("Error fetching AuditLog:", error);
      return res.status(500).json({
        message: "Failed to fetch AuditLog",
        });
    }
  } 
  
  return{
    createAuditLog,
    getAuditLog
  }
}
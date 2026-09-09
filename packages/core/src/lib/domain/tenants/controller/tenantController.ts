import {  Request, Response } from "express";
import { tenantServices } from "../services/tenantServices";

export function tenantController() {
  const createTenant = async (req: Request, res: Response) => {
    try {
      const result = await tenantServices().createTenant(req.body);
      return res.status(201).json(result);
    } catch (error) {
      console.error("Error creating tenant:", error);
      return res.status(500).json({
        message: "Failed to create tenant",
      });
    }
  };

  const getTenants = async (req: Request, res: Response) => {
    try {
      const result = await tenantServices().getTenants();
      return res.status(200).json(result);
    }
    catch (error) {
      console.error("Error fetching tenants:", error);
      return res.status(500).json({
        message: "Failed to fetch tenants",
        });
    }
  } 

  const updateTenant = async (req: Request, res: Response) => {
    try {
        const result = await tenantServices().updateTenant(req.params["id"], req.body);
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error updating tenant:", error);
        return res.status(500).json({
            message: "Failed to update tenant",
        });
    }
    };

    const deleteTenant = async (req: Request, res: Response) => {
    try {
        const result = await tenantServices().deleteTenant(req.params["id"]);
        return res.status(200).json(result);
    }
    catch (error) {
        console.error("Error deleting tenant:", error);
        return res.status(500).json({
            message: "Failed to delete tenant",
        });
    }
    };

  return {
    createTenant,
    getTenants,
    updateTenant,
    deleteTenant
  }
}
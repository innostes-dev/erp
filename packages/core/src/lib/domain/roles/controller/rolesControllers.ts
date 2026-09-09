import { Request, Response } from "express";
import { rolesServices } from "../services/rolesServices";

export function rolesController() {
  const createRole = async (req: Request, res: Response) => {
    try {
      const result = await rolesServices().createRole(req.body);
      return res.status(201).json(result);
    } catch (error) {
      console.error("Error creating role:", error);
      return res.status(500).json({
        message: "Failed to create role",
      });
    }
  };

  const getRoles = async (req: Request, res: Response) => {
    try {
      const result = await rolesServices().getRoles();
      return res.status(200).json(result);
    }
    catch (error) {
      console.error("Error fetching roles:", error);
      return res.status(500).json({
        message: "Failed to fetch roles",
        });
    }
  } 

  const updateRole = async (req: Request, res: Response) => {
    try {
        const result = await rolesServices().updateRole(req.params["id"], req.body);
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error updating role:", error);
        return res.status(500).json({
            message: "Failed to update role",
        });
    }
    };

    const deleteRole = async (req: Request, res: Response) => {
    try {
        const result = await rolesServices().deleteRole(req.params["id"]);
        return res.status(200).json(result);
    }
    catch (error) {
        console.error("Error deleting role:", error);
        return res.status(500).json({
            message: "Failed to delete role",
        });
    }
    };

  return{
    createRole, 
    getRoles,
    updateRole,
    deleteRole
  }
}
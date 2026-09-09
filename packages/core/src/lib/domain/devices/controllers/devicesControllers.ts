import { Request, Response } from "express";
import { devicesServices } from "../services/devicesServices";

export function devicesController() {
  const createDevice = async (req: Request, res: Response) => {
    try {
      const result = await devicesServices().createDevice(req.body);
      return res.status(201).json(result);
    } catch (error) {
      console.error("Error creating device:", error);
      return res.status(500).json({
        message: "Failed to create device",
      });
    }
  };

  const getDevices = async (req: Request, res: Response) => {
    try {
      const result = await devicesServices().getDevices();
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching devices:", error);
      return res.status(500).json({
        message: "Failed to fetch devices",
      });
    }
  };

  return {
    createDevice,
    getDevices,
  };
}

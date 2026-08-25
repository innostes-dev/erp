import {Request, Response} from 'express';
import {z} from 'zod';
import {getDeviceDto} from '../dtos/get-device.dto';

export const getDeviceController = async (req: Request, res: Response) => {
    try {
        const validatedData = getDeviceDto.parse({params: req.params});
        return res.status(200).json({message: 'Device retrieved successfully', data: validatedData});
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({message: 'Validation error', errors: error});
        }
        return res.status(500).json({message: 'Internal server error'});
    }
}
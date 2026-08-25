import {Request, Response} from 'express';
import {z} from 'zod';
import {CreateDeviceDto} from '../dtos/create.dto';

export const createDeviceController = async (req: Request, res: Response) => {
    try {
        const validatedData = CreateDeviceDto.parse({body: req.body});
        return res.status(201).json({message: 'Device created successfully', data: validatedData});
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({message: 'Validation error', errors: error});
        }
        return res.status(500).json({message: 'Internal server error'});
    }
};
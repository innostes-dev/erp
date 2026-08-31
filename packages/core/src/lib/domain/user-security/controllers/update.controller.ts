import {Request, Response} from 'express';
import {z} from 'zod';
import { updateUserSecurityDto } from '../dtos';

export const updateUserSecurityController = async (req: Request, res: Response) => {
    try{
        const validateData = updateUserSecurityDto.parse(req.body);
        return res.status(201).json({message: 'User security created successfully', data: validateData});
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({message: 'Validation error', errors: error});
        }
        return res.status(500).json({message: 'Internal server error', error: error});
    }
}
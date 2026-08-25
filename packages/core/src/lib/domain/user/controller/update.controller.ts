import { Request, Response } from 'express';
import { z } from 'zod';
import { updateUserDto } from '../dtos/update.dto';

export const updateUserController = async (req: Request, res: Response) => {
    try {
        const validateData = updateUserDto.parse(req.body);
        return res.send({ message: 'User updated successfully', data: validateData });        
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error});
        } 
        return error;
    }
};
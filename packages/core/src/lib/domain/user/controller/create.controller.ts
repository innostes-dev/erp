import { Request, Response } from 'express';
import { z } from 'zod';
import { createUserDto } from '../dtos/create.dto';

export const createUserController = async (req: Request, res: Response) => {
    try {
        const validateData = createUserDto.parse(req.body);
        return res.send({ message: 'User created successfully', data: validateData });        
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error});
        } 
        return error;
    }
};
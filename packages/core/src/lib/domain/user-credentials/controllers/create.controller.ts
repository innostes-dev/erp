import { Request, Response } from 'express';
import { z } from 'zod';
import { CreateUserCredentialsDto } from '../dtos/create.dto';

export const createUserCredentialsController = async (req: Request, res: Response) => {
    try {
        const validateData = CreateUserCredentialsDto.parse(req.body);
        return res.send({ message: 'User credentials created successfully', data: validateData });        
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error});
        } 
        return error;
    }
};
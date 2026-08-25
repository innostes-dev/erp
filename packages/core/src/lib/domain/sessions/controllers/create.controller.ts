import {Request, Response} from 'express';
import {z} from 'zod';
import {CreateSessionDto} from '../dtos';

export const createSession = async (req: Request, res: Response) => {
    try {
        const validatedData = CreateSessionDto.parse(req.body);
        return res.status(201).json({message: 'Session created successfully', data: validatedData});
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({message: 'Invalid input data', errors: error});
        }
        return res.status(500).json({message: 'Internal server error'});
    }
};
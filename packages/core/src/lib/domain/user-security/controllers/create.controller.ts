import {Request, Response} from 'express';
import {z} from 'zod';
import {CreateUserSecurityDto} from '../dtos/create.dto';

export const createUserSecurityController = async (req: Request, res: Response) => {
    try{
        const validateData = CreateUserSecurityDto.parse(req.body);
        return res.status(201).json({message: 'User security created successfully', data: validateData});
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({message: 'Validation error', errors: error});
        }
        return res.status(500).json({message: 'Internal server error', error: error});
    }
}
import {Request, Response} from 'express';
import {z} from 'zod';
import {GetUserCredentialsDto} from '../dtos/get-user-credentials.dto';

export const getUserCredentialsController = async (req: Request, res: Response) => {
    try {
        const validateData = GetUserCredentialsDto.parse(req.body);
        return res.send({message: 'User credentials retrieved successfully', data: validateData});
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({message: error});
        }
        return error;
    }
}
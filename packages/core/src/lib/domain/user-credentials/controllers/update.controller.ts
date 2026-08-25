import {Request, Response} from 'express';
import {z} from 'zod';
import {UpdateUserCredentialsDto} from '../dtos/update.dto';

export const updateUserCredentialsController = async (req: Request, res: Response) => {
    try {
        const validateData = UpdateUserCredentialsDto.parse(req.body);
        return res.send({message: 'User credentials updated successfully', data: validateData});
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({message: error});
        }
        return error;
    }
}
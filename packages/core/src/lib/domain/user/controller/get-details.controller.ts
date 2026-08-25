import {Request, Response} from 'express';
import { z } from 'zod';
import { getUserDetailsDto } from '../dtos/get-details.dto';

export const getUserDetailsController = async (req: Request, res: Response) => {
    try {
        const validateData = getUserDetailsDto.parse(req.params);
        return res.send({ message: 'User details fetched successfully', data: validateData });        
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error});
        }
        return error;
    }
}
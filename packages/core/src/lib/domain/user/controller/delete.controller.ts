import { Request, Response} from 'express';
import { z } from 'zod';
import { deleteUserDto } from '../dtos/delete.dto';

export const deleteUserController = async (req: Request, res: Response) => {
    try {
        const validateData = deleteUserDto.parse(req.params);
        return res.send({ message: 'User deleted successfully', data: validateData });        
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error});
        } 
        return error;
    }
};
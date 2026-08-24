import { Router } from 'express';
import { createUserController } from './controller/create.controller';

export function userRouter(): Router {
    const userRouter = Router();
    userRouter.post('/create-user', createUserController);
    return userRouter;
}
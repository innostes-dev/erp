import { Router } from 'express';
import { createUserController } from './controller/create.controller';
import { updateUserController } from './controller/update.controller';
import { deleteUserController } from './controller/delete.controller';
import { getUserDetailsController } from './controller/get-details.controller';

export function userRouter(): Router {
    const userRouter = Router();
    userRouter.get('/get-user-details/:user_id', getUserDetailsController);
    userRouter.post('/create-user', createUserController);
    userRouter.put('/update-user', updateUserController);
    userRouter.delete('/delete-user/:user_id', deleteUserController);
    return userRouter;
}
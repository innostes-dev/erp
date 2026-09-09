import {Router} from 'express';
import {userController} from './controllers/usersController';

export  function usersRouter(): Router{
    const router = Router();
    const userctrl = userController();
    router.post('/create-users', userctrl.createUsers);
    return router;
}
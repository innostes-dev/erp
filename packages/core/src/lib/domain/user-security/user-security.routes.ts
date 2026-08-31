import {Router} from 'express';
import {userController} from './controllers/user-securityController';

export  function userSecurityRouter(): Router{
    const router = Router();
    const userctrl = userController();
    router.post('/create-user-security', userctrl.createUserSecurity);
    return router;
}
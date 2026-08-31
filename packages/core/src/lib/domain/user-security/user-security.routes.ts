import {Router} from 'express';
import { createUserSecurityController } from './controllers';
import { updateUserSecurityController } from './controllers';

export  function userSecurityRouter(): Router{
    const router = Router();
    router.post('/create-user-security', createUserSecurityController);
    router.put('/update-user-security', updateUserSecurityController);
    return router;
}
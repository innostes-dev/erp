import {Router} from 'express';
import {createUserCredentialsController} from './controllers/create.controller';

export function userCredentialsRouter(): Router {
    const router = Router();
    router.get('/get-user-credentials/:user_id', createUserCredentialsController);
    router.post('/create-user-credentials', createUserCredentialsController);
    router.put('/update-user-credentials', createUserCredentialsController);
    return router;
}
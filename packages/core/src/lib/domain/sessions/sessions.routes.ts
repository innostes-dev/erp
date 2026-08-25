import {Router} from 'express';
import {createSession} from './controllers';

export function sessionsRoutes(): Router {
    const router = Router();
    router.post('/create-session', createSession);
    return router;
}
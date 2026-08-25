import {Router} from 'express';
import {createPasswordResetToken} from './controller/create.controller';
import { updatePasswordResetToken } from './controller';

export function passwordResetTokensRouter(): Router {
  const router = Router();
  router.post('/create-password-reset-token', createPasswordResetToken);
  router.put('/update-password-reset-token', updatePasswordResetToken);
  return router;
}
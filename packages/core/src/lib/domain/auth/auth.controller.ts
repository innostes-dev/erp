import { Router, Request, Response } from 'express';

export function createAuthRouter(): Router {
  const router = Router();

  router.get('/login', (req: Request, res: Response) => {
    res.json({
      message: 'Login successful (Dummy Data)',
      token: 'dummy-session-token-12345',
      user: {
        id: 1,
        email: req.body.email || 'dummy@example.com',
      },
    });
  });

  return router;
}

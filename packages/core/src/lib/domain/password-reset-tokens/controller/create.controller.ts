import { Request, Response } from 'express';
import { z } from 'zod';
import { createPasswordResetTokenDto } from '../dtos';

export function createPasswordResetToken(req: Request, res: Response) {
  try {
    const validateData = createPasswordResetTokenDto.parse(req.body);
    return res.status(200).json({
      message: 'Password reset token created successfully',
      data: validateData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error,
      });
    }

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}

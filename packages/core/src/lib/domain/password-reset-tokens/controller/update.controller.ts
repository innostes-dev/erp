import { Request, Response } from 'express';
import { z } from 'zod';
import { updatePasswordResetTokenDto } from '../dtos';

export function updatePasswordResetToken(req: Request, res: Response) {
  try {
    const validateData = updatePasswordResetTokenDto.parse(req.body);
    return res.status(200).json({
      message: 'Password reset token updated successfully',
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

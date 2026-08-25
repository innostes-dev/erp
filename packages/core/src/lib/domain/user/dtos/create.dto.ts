import { z } from 'zod';

export const createUserDto = z.object({
    body: z.object({
        first_name: z.string().min(1, 'First name is required').max(20, 'First name must be at most 20 characters'),
        last_name: z.string().min(1, 'Last name is required').max(20, 'Last name must be at most 20 characters'),
        middle_name: z.string().max(20, 'Middle name must be at most 20 characters').optional(),
        gender: z.number().int().min(0, 'Invalid gender').max(2, 'Invalid gender'),
        email: z.string().email('Invalid email format').max(255, 'Email must be at most 255 characters'),
        phone: z.string().length(10, 'Invalid Indian mobile number format'),
        role_id: z.string().uuid('Invalid UUID format'),
    }),
});

export type CreateUserDto = z.infer<typeof createUserDto>;
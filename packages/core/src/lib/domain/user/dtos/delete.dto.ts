import { z } from 'zod';

export const deleteUserDto = z.object({
    params: z.object({
        user_id: z.string().uuid('Invalid UUID format')
    })
});

export type DeleteUserDto = z.infer<typeof deleteUserDto>;
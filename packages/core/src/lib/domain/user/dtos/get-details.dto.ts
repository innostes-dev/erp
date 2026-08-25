import {z} from 'zod';

export const getUserDetailsDto = z.object({
    params: z.object({
        user_id: z.string().uuid('Invalid UUID format'),
    }),
});

export type GetUserDetailsDto = z.infer<typeof getUserDetailsDto>;
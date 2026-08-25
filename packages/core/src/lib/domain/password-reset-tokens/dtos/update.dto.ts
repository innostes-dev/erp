import {z} from 'zod';

export const updatePasswordResetTokenDto = z.object({
    user_id: z.string().uuid(),
    request_ip: z.string(),
    user_agent: z.string(),
});

export type UpdatePasswordResetTokenDto = z.infer<typeof updatePasswordResetTokenDto>;
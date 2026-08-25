import {z} from 'zod';

export const createPasswordResetTokenDto = z.object({
    user_id: z.string().uuid(),
    request_ip: z.string(),
    user_agent: z.string(),
});

export type CreatePasswordResetTokenDto = z.infer<typeof createPasswordResetTokenDto>;

import {z} from 'zod';

export const CreateSessionDto = z.object({
    user_id: z.string().uuid(),
    device_id: z.string().uuid(),
    access_token: z.string().uuid(),
    refresh_token: z.string().uuid(),
    ip_address: z.string().optional(),
    user_agent: z.string().optional(),
});

export type CreateSessionDtoType = z.infer<typeof CreateSessionDto>;
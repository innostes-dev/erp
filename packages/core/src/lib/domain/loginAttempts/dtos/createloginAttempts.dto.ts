import {z} from 'zod';

const createloginAttemptsDto = z.object({
    user_id: z.string().uuid(),
    ip_reputation_id: z.string().uuid(),
    ip_address: z.string().min(7).max(15),
    success: z.boolean(),
    failure_reason: z.string().optional(),
    user_agent: z.string().optional()
});

export type CreateLoginAttemptDto = z.infer<typeof createloginAttemptsDto>;  
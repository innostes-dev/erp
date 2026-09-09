import {z} from 'zod';

const createIpReputationDto = z.object({
    ip_address : z.string().min(7).max(15),
    risk_score : z.number().min(0).max(100).optional(),
    status : z.enum(['safe','suspicious','malicious']),
    reason : z.string().optional()
});

export type CreateIpReputationDto = z.infer<typeof createIpReputationDto>;  
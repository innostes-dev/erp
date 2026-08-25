import {z} from 'zod';

const createRoleDto = z.object({
    
    name : z.string().min(3).max(50),
    description : z.string().optional(),
    permissions : z.array(z.string()).optional()
});

export type CreateRoleDto = z.infer<typeof createRoleDto>;  
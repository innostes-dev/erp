import {z} from 'zod';

const createTenantDto = z.object({
    name: z.string().min(3).max(255),
    slug: z.string().min(3).max(255),
    address: z.string().optional(),
    logo_url: z.string().url().optional()
});

export type CreateTenantDto = z.infer<typeof createTenantDto>;  
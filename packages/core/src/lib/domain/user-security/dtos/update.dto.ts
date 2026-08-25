import {z} from 'zod';

export const updateUserSecurityDto = z.object({
  user_id: z.string().uuid(),
  failure_count: z.number().int().nonnegative().default(0),
  locked_time: z.date().nullable().default(null),
});

export type UpdateUserSecurityDto = z.infer<typeof updateUserSecurityDto>;
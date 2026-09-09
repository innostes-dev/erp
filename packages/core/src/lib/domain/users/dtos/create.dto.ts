import {z} from 'zod';

export const CreateUsersDto = z.object({
  user_id: z.string().uuid(),
  failure_count: z.number().int().nonnegative().default(0),
  locked_time: z.date().nullable().default(null),
});

export type CreateUsersDto = z.infer<typeof CreateUsersDto>;
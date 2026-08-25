import {z} from 'zod';

export const UpdateUserCredentialsDto = z.object({
  'user-id': z.string().uuid(),
  'password': z.string().min(8)
});

export type UpdateUserCredentialsDto = z.infer<typeof UpdateUserCredentialsDto>;
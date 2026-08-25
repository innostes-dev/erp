import {z} from 'zod';

export const GetUserCredentialsDto = z.object({
  'user-id': z.string().uuid()
});

export type GetUserCredentialsDto = z.infer<typeof GetUserCredentialsDto>;  
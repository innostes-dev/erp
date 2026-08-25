import {z} from 'zod';

export const CreateUserCredentialsDto = z.object({
  user_id: z.string().uuid('Invalid UUID format'),
  password: z.string().min(8)
});

export type CreateUserCredentialsDto = z.infer<typeof CreateUserCredentialsDto>;
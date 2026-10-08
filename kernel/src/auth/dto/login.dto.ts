import type { z } from 'zod';
import type { loginSchema } from '../schemas/auth.schema.js';

export type LoginDto = z.infer<typeof loginSchema>;

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId?: string;
}

export interface LoginResponseDto {
  token: string;
  refreshToken?: string;
  user: AuthUserDto;
}

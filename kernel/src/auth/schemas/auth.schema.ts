import { z, extendZodWithOpenApi } from '@hono/zod-openapi';

extendZodWithOpenApi(z);

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email({ message: 'Invalid email address' })
      .openapi({ description: 'Registered user email address', example: 'admin@innostes.com' }),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters long' })
      .openapi({ description: 'User account password', example: 'Admin123!' }),
  })
  .openapi('LoginInput');

export const authUserSchema = z
  .object({
    id: z.string().openapi({ description: 'User unique ID', example: 'usr_998877' }),
    name: z.string().openapi({ description: 'User full name', example: 'System Administrator' }),
    email: z.string().email().openapi({ description: 'User email', example: 'admin@innostes.com' }),
    role: z.string().openapi({ description: 'User role', example: 'ADMIN' }),
    tenantId: z.string().optional().openapi({ description: 'Active organization tenant ID', example: 'org_12345' }),
  })
  .openapi('AuthUser');

export const loginResponseDataSchema = z
  .object({
    token: z.string().openapi({ description: 'Signed JWT Bearer access token', example: 'eyJhbGciOiJIUzI1NiIsIn...' }),
    refreshToken: z.string().optional().openapi({ description: 'Optional session refresh token' }),
    user: authUserSchema,
  })
  .openapi('LoginResponseData');

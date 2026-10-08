import { z, extendZodWithOpenApi } from '@hono/zod-openapi';

// Initialize Zod OpenAPI prototype extensions
extendZodWithOpenApi(z);

/**
 * Standard ERP Error Response OpenAPI Schema
 */
export const ErrorResponseSchema = z
  .object({
    success: z.boolean().openapi({
      description: 'Indicates whether the request succeeded or failed',
      example: false,
    }),
    error: z.object({
      code: z.string().openapi({
        description: 'Machine-readable error code',
        example: 'RESOURCE_NOT_FOUND',
      }),
      message: z.string().openapi({
        description: 'Human-readable error explanation',
        example: 'The requested resource was not found.',
      }),
      details: z.unknown().optional().openapi({
        description: 'Additional validation errors or context',
      }),
    }),
    meta: z
      .object({
        timestamp: z.string().openapi({
          description: 'ISO-8601 server timestamp of the response',
          example: '2026-10-08T18:00:00.000Z',
        }),
        brand: z.string().openapi({
          description: 'ERP platform branding header',
          example: 'Innostes OS',
        }),
      })
      .optional(),
  })
  .openapi('ErrorResponse');

/**
 * Helper to build standard success response schemas for OpenAPI endpoints
 */
export function createSuccessSchema<T extends z.ZodTypeAny>(
  dataSchema: T,
  schemaName?: string
) {
  const schema = z.object({
    success: z.boolean().openapi({
      description: 'Indicates success status of the request',
      example: true,
    }),
    data: dataSchema.optional(),
    meta: z
      .object({
        timestamp: z.string().openapi({
          description: 'ISO-8601 server timestamp',
          example: '2026-10-08T18:00:00.000Z',
        }),
        brand: z.string().openapi({
          description: 'ERP platform branding header',
          example: 'Innostes OS',
        }),
      })
      .optional(),
  });

  return schemaName ? schema.openapi(schemaName) : schema;
}

/**
 * Common HTTP error responses reusable across OpenAPI route specifications
 */
export const StandardErrorResponses = {
  400: {
    description: 'Bad Request - Invalid parameters or malformed request payload',
    content: {
      'application/json': {
        schema: ErrorResponseSchema,
      },
    },
  },
  401: {
    description: 'Unauthorized - Missing or invalid authentication token',
    content: {
      'application/json': {
        schema: ErrorResponseSchema,
      },
    },
  },
  403: {
    description: 'Forbidden - Insufficient permissions for the requested resource',
    content: {
      'application/json': {
        schema: ErrorResponseSchema,
      },
    },
  },
  404: {
    description: 'Not Found - The requested resource does not exist',
    content: {
      'application/json': {
        schema: ErrorResponseSchema,
      },
    },
  },
  409: {
    description: 'Conflict - Resource already exists or state conflict',
    content: {
      'application/json': {
        schema: ErrorResponseSchema,
      },
    },
  },
  422: {
    description: 'Unprocessable Entity - Input validation error',
    content: {
      'application/json': {
        schema: ErrorResponseSchema,
      },
    },
  },
  500: {
    description: 'Internal Server Error - An unexpected error occurred on the server',
    content: {
      'application/json': {
        schema: ErrorResponseSchema,
      },
    },
  },
};

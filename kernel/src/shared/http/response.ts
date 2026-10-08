export interface InnostesApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
  meta?: {
    timestamp: string;
    brand: string;
    [key: string]: unknown;
  };
}

export function createSuccessResponse<T>(data: T, meta?: Record<string, unknown>): InnostesApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      brand: 'Innostes OS',
      ...meta,
    },
  };
}

export function createErrorResponse(
  message: string,
  code = 'INTERNAL_SERVER_ERROR',
  details?: unknown,
  rawError?: unknown,
  meta?: Record<string, unknown>
): InnostesApiResponse<null> {
  const isProduction = process.env.NODE_ENV === 'production';

  const isInternalServerError = code === 'INTERNAL_SERVER_ERROR';
  const safeMessage = isProduction && isInternalServerError
    ? 'An unexpected error occurred. Please try again later.'
    : message;

  const safeDetails = isProduction && isInternalServerError
    ? undefined
    : details;

  const stack = !isProduction && rawError instanceof Error
    ? rawError.stack
    : undefined;

  return {
    success: false,
    error: {
      code,
      message: safeMessage,
      ...(safeDetails !== undefined && { details: safeDetails }),
      ...(stack && { stack }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      brand: 'Innostes OS',
      ...meta,
    },
  };
}

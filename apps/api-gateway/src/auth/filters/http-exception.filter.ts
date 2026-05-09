/**
 * apps/api-gateway/src/auth/filters/http-exception.filter.ts
 * Standardizes API error responses.
 */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';

    if (exceptionResponse && typeof exceptionResponse === 'object') {
      code = (exceptionResponse as any).code || code;
      message = (exceptionResponse as any).message || message;
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    }

    // Log 5xx errors
    if (status >= 500) {
      this.logger.error(
        `${status} Error: ${message}`,
        exception instanceof Error ? exception.stack : undefined
      );
    }

    response.status(status).send({
      success: false,
      error: {
        message,
        code,
      },
    });
  }
}

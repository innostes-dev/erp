/**
 * libs/core/auth/src/filters/http-exception.filter.ts
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
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' };

    let message = (exceptionResponse as any).message || 'Internal server error';
    const code = (exceptionResponse as any).code || (status === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_SERVER_ERROR');

    if (status >= 500) {
      this.logger.error(`[${status}] ${message}`, exception.stack);
      message = 'Internal server error'; // Hide real message for 500s
    }

    response.status(status).send({
      success: false,
      error: {
        message: Array.isArray(message) ? message[0] : message,
        code: code,
      },
    });
  }
}

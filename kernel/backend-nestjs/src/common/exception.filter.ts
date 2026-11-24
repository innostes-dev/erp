import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ErrorCode, ServiceError } from './errors';
import { RequestValidationException } from './validation';

interface BodyParserError extends Error {
  status?: number;
  statusCode?: number;
  type?: string;
}

/** Renders every error as `{detail, code?}` (or the 422 `{detail:[...]}` list), never leaking internals. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = 500;
    let body: Record<string, unknown> = { detail: 'Internal server error' };
    let headers: Record<string, string> = {};

    if (exception instanceof ServiceError) {
      status = exception.status;
      body = exception.code ? { detail: exception.message, code: exception.code } : { detail: exception.message };
      headers = exception.headers;
    } else if (exception instanceof RequestValidationException) {
      status = 422;
      body = { detail: exception.items };
    } else if (exception instanceof ThrottlerException) {
      status = 429;
      body = { detail: 'Too many requests. Try again later.', code: ErrorCode.RATE_LIMITED };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse();
      const message = typeof r === 'string' ? r : ((r as { message?: unknown }).message ?? exception.message);
      body = { detail: Array.isArray(message) ? message.join('; ') : String(message) };
      if (status === 404 && /^Cannot (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) /.test(String(body.detail))) {
        body = { detail: 'Not Found' };
      }
    } else if (exception instanceof Error) {
      const e = exception as BodyParserError;
      if (typeof e.status === 'number' && e.status >= 400 && e.status < 500) {
        status = e.status;
        body = { detail: e.message };
      } else {
        this.logger.error({ err: exception, path: req.path, method: req.method }, 'Unhandled exception');
      }
    } else {
      this.logger.error({ err: exception, path: req.path, method: req.method }, 'Unhandled non-error exception');
    }

    if (res.headersSent) return;
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    res.status(status).json(body);
  }
}

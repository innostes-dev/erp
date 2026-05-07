import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
interface JsonResponse {
  status(code: number): { json(body: unknown): void };
}

interface ErrorBody {
  success: false;
  data: null;
  message: string;
  code: string;
  statusCode: number;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<JsonResponse>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as { message?: string }).message ?? message;
      code = exception.constructor.name.replace('Exception', '').toUpperCase();
    } else {
      this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
    }

    const body: ErrorBody = { success: false, data: null, message, code, statusCode };
    response.status(statusCode).json(body);
  }
}

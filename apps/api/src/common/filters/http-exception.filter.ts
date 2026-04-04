import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const normalizedResponse =
        typeof exceptionResponse === 'string'
          ? {
              error: exception.name,
              message: exceptionResponse,
            }
          : (exceptionResponse as Record<string, unknown>);

      response.status(status).json({
        statusCode: status,
        error:
          typeof normalizedResponse.error === 'string'
            ? normalizedResponse.error
            : exception.name,
        message: normalizedResponse.message ?? exception.message,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
      return;
    }

    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message: 'An unexpected error occurred.',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

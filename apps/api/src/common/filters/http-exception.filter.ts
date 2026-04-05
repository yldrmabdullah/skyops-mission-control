import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
  code?: string;
  details?: any;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: Partial<ErrorResponse> = {
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionRes = exception.getResponse() as any;

      errorResponse = {
        ...errorResponse,
        statusCode: status,
        error: exception.name,
        // If it's a validation error from class-validator it may have an array of messages
        message: exceptionRes.message || exception.message,
      };

      // Support for DomainException fields (code, details)
      if (typeof exceptionRes === 'object') {
        if (exceptionRes.code) errorResponse.code = exceptionRes.code;
        if (exceptionRes.details) errorResponse.details = exceptionRes.details;
      }
    } else {
      // Unhandled / Internal Server Errors
      this.logger.error(
        `[${request.method}] ${request.url} - Unhandled Exception`,
        exception instanceof Error ? exception.stack : String(exception),
      );

      errorResponse = {
        ...errorResponse,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'InternalServerError',
        message: 'An unexpected operational error occurred.',
      };
    }

    response.status(status).json(errorResponse);
  }
}

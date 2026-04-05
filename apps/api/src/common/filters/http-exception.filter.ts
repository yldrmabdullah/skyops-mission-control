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
  details?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
      const exceptionRes = exception.getResponse();

      let message: string | string[];
      if (typeof exceptionRes === 'string') {
        message = exceptionRes;
      } else if (isRecord(exceptionRes)) {
        const msg = exceptionRes.message;
        message =
          typeof msg === 'string' || Array.isArray(msg)
            ? msg
            : exception.message;
      } else {
        message = exception.message;
      }

      errorResponse = {
        ...errorResponse,
        statusCode: status,
        error: exception.name,
        message,
      };

      if (isRecord(exceptionRes)) {
        if (typeof exceptionRes.code === 'string') {
          errorResponse.code = exceptionRes.code;
        }
        if ('details' in exceptionRes) {
          errorResponse.details = exceptionRes.details;
        }
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

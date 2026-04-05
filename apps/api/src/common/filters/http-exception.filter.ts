import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

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

    const base: Pick<ErrorResponse, 'timestamp' | 'path'> = {
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
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

      const errorResponse: Partial<ErrorResponse> = {
        ...base,
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

      return response.status(status).json(errorResponse);
    }

    if (exception instanceof QueryFailedError) {
      const pgCode = (exception.driverError as { code?: string } | undefined)
        ?.code;
      /** Postgres exclusion constraint violation (e.g. overlapping mission windows). */
      if (pgCode === '23P01') {
        return response.status(HttpStatus.CONFLICT).json({
          ...base,
          statusCode: HttpStatus.CONFLICT,
          error: 'ExclusionViolation',
          message:
            'This schedule conflicts with an existing active mission on the same drone.',
          code: 'MISSION_SCHEDULE_OVERLAP',
        } satisfies ErrorResponse);
      }
    }

    this.logger.error(
      `[${request.method}] ${request.url} - Unhandled Exception`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      ...base,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message: 'An unexpected operational error occurred.',
    } satisfies ErrorResponse);
  }
}

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base class for all business domain exceptions.
 * These are expected errors that represent a violation of a business rule,
 * not a system failure.
 */
export class DomainException extends HttpException {
  constructor(
    message: string,
    public readonly code: string = 'DOMAIN_ERROR',
    status: number = HttpStatus.BAD_REQUEST,
    public readonly details?: Record<string, any>,
  ) {
    super(
      {
        message,
        code,
        details,
      },
      status,
    );
  }
}

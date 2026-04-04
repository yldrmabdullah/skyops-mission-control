import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayloadUser } from '../strategies/jwt.strategy';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtPayloadUser => {
    const request = context.switchToHttp().getRequest<Request>();
    return request.user as JwtPayloadUser;
  },
);

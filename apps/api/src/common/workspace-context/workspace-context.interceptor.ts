import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { JwtPayloadUser } from '../../auth/strategies/jwt.strategy';
import { WorkspaceContext } from './workspace-context';

@Injectable()
export class WorkspaceContextInterceptor implements NestInterceptor {
  constructor(private readonly workspaceContext: WorkspaceContext) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: JwtPayloadUser }>();
    const user = request.user;
    if (user && user.fleetOwnerId && user.userId) {
      this.workspaceContext.set(user.fleetOwnerId, user.userId);
    }
    return next.handle();
  }
}

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../audit/audit.service';
import { WorkspaceContext } from '../workspace-context/workspace-context';
import { AUDIT_METADATA_KEY, AuditOptions } from './audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
    private readonly workspaceContext: WorkspaceContext,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<AuditOptions>(
      AUDIT_METADATA_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (result) => {
        // If we have an initialized workspace context, record the audit log
        if (this.workspaceContext.isInitialized) {
          const entityId = options.extractEntityId 
            ? options.extractEntityId(result) 
            : (result?.id || result?.uuid);

          if (entityId) {
            void this.auditService.record(
              this.workspaceContext.actorId,
              options.action,
              options.entityType,
              entityId,
              // We could potentially add more metadata here from result
              result?.metadata || {}
            ).catch(() => {});
          }
        }
      }),
    );
  }
}

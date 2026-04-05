import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Scope,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../audit/audit.service';
import { WorkspaceContext } from '../workspace-context/workspace-context';
import { AUDIT_METADATA_KEY, AuditOptions } from './audit.decorator';

function extractAuditEntityId(result: unknown): string | undefined {
  if (!result || typeof result !== 'object') {
    return undefined;
  }
  const row = result as Record<string, unknown>;
  const id = row['id'];
  const uuid = row['uuid'];
  if (typeof id === 'string') {
    return id;
  }
  if (typeof uuid === 'string') {
    return uuid;
  }
  return undefined;
}

function extractAuditMetadata(result: unknown): Record<string, unknown> {
  if (!result || typeof result !== 'object' || !('metadata' in result)) {
    return {};
  }
  const meta = (result as { metadata?: unknown }).metadata;
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    return meta as Record<string, unknown>;
  }
  return {};
}

@Injectable({ scope: Scope.REQUEST })
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
      tap((result: unknown) => {
        if (!this.workspaceContext.isInitialized) {
          return;
        }

        const entityId = options.extractEntityId
          ? options.extractEntityId(result)
          : extractAuditEntityId(result);

        if (!entityId) {
          return;
        }

        const metadata = extractAuditMetadata(result);

        void this.auditService
          .record(
            this.workspaceContext.actorId,
            options.action,
            options.entityType,
            entityId,
            metadata,
          )
          .catch(() => {});
      }),
    );
  }
}

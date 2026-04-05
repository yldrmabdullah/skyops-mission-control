import { Module, Scope } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditModule } from '../../audit/audit.module';
import { WorkspaceContextModule } from '../workspace-context/workspace-context.module';
import { AuditInterceptor } from './audit.interceptor';

@Module({
  imports: [AuditModule, WorkspaceContextModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      scope: Scope.REQUEST,
      useClass: AuditInterceptor,
    },
  ],
})
export class CommonAuditModule {}

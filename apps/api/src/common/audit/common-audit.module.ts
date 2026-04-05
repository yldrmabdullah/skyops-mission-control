import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditModule } from '../../audit/audit.module';
import { WorkspaceContextModule } from '../workspace-context/workspace-context.module';
import { AuditInterceptor } from './audit.interceptor';

@Module({
  imports: [AuditModule, WorkspaceContextModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class CommonAuditModule {}

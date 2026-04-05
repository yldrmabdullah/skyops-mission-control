import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { WorkspaceContext } from './workspace-context';
import { WorkspaceContextInterceptor } from './workspace-context.interceptor';

@Global()
@Module({
  providers: [
    WorkspaceContext,
    {
      provide: APP_INTERCEPTOR,
      useClass: WorkspaceContextInterceptor,
    },
  ],
  exports: [WorkspaceContext],
})
export class WorkspaceContextModule {}

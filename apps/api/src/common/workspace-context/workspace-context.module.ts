import { Global, Module, Scope } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { WorkspaceContext } from './workspace-context';
import { WorkspaceContextInterceptor } from './workspace-context.interceptor';

@Global()
@Module({
  providers: [
    WorkspaceContext,
    {
      provide: APP_INTERCEPTOR,
      scope: Scope.REQUEST,
      useClass: WorkspaceContextInterceptor,
    },
  ],
  exports: [WorkspaceContext],
})
export class WorkspaceContextModule {}

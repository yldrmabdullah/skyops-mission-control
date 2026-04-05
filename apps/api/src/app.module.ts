import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { validateEnvironment } from './config/env.validation';
import { typeOrmModuleAsyncOptions } from './database/typeorm.config';
import { DronesModule } from './drones/drones.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { MissionsModule } from './missions/missions.module';
import { ReportsModule } from './reports/reports.module';
import { WorkspaceContextModule } from './common/workspace-context/workspace-context.module';
import { CommonAuditModule } from './common/audit/common-audit.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    TypeOrmModule.forRootAsync(typeOrmModuleAsyncOptions),
    ScheduleModule.forRoot(),
    AuthModule,
    DronesModule,
    MissionsModule,
    MaintenanceModule,
    ReportsModule,
    WorkspaceContextModule,
    CommonAuditModule,
  ],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    ThrottlerGuard,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { validateEnvironment } from './config/env.validation';
import { typeOrmModuleAsyncOptions } from './database/typeorm.config';
import { DronesModule } from './drones/drones.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { MissionsModule } from './missions/missions.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRootAsync(typeOrmModuleAsyncOptions),
    AuthModule,
    DronesModule,
    MissionsModule,
    MaintenanceModule,
    ReportsModule,
  ],
  providers: [JwtAuthGuard, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}

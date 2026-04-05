import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { DataType, newDb } from 'pg-mem';
import { User } from '../auth/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuditEvent } from '../audit/entities/audit-event.entity';
import { Drone } from '../drones/entities/drone.entity';
import { DronesModule } from '../drones/drones.module';
import { MaintenanceLog } from '../maintenance/entities/maintenance-log.entity';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { Mission } from '../missions/entities/mission.entity';
import { MissionsModule } from '../missions/missions.module';
import { InAppNotification } from '../notifications/entities/in-app-notification.entity';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      load: [
        () => ({
          JWT_SECRET: 'e2e-jwt-secret-must-be-32-chars-minimum!',
          JWT_EXPIRES_IN: '7d',
        }),
      ],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 10_000,
      },
    ]),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () =>
        ({
          type: 'postgres',
          entities: [
            User,
            Drone,
            Mission,
            MaintenanceLog,
            AuditEvent,
            InAppNotification,
          ],
          synchronize: true,
          logging: false,
        }) satisfies DataSourceOptions,
      dataSourceFactory: (options) => {
        const database = newDb({
          autoCreateForeignKeyIndices: true,
        });

        database.public.registerFunction({
          name: 'version',
          returns: DataType.text,
          implementation: () => '14.0',
        });
        database.public.registerFunction({
          name: 'current_database',
          returns: DataType.text,
          implementation: () => 'skyops_e2e',
        });
        database.public.registerFunction({
          name: 'uuid_generate_v4',
          returns: DataType.uuid,
          implementation: () => randomUUID(),
          impure: true,
        });

        const dataSource = database.adapters.createTypeormDataSource(
          options as DataSourceOptions,
        ) as DataSource;

        return dataSource.initialize();
      },
    }),
    AuthModule,
    DronesModule,
    MissionsModule,
    MaintenanceModule,
    ReportsModule,
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
export class E2eModule {}

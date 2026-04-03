import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataType, newDb } from 'pg-mem';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Drone } from '../drones/entities/drone.entity';
import { DronesModule } from '../drones/drones.module';
import { MaintenanceLog } from '../maintenance/entities/maintenance-log.entity';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { Mission } from '../missions/entities/mission.entity';
import { MissionsModule } from '../missions/missions.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () =>
        ({
          type: 'postgres',
          entities: [Drone, Mission, MaintenanceLog],
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
    DronesModule,
    MissionsModule,
    MaintenanceModule,
    ReportsModule,
  ],
})
export class E2eModule {}

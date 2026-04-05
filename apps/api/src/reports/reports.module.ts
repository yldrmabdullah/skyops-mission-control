import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drone } from '../drones/entities/drone.entity';
import { MaintenanceLog } from '../maintenance/entities/maintenance-log.entity';
import { Mission } from '../missions/entities/mission.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { DronesModule } from '../drones/drones.module';
import { MissionsModule } from '../missions/missions.module';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { WorkspaceContextModule } from '../common/workspace-context/workspace-context.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Drone, Mission, MaintenanceLog]),
    DronesModule,
    MissionsModule,
    MaintenanceModule,
    WorkspaceContextModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}

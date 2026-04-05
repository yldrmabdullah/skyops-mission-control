import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { Drone } from '../drones/entities/drone.entity';
import { WorkspaceContextModule } from '../common/workspace-context/workspace-context.module';
import { MaintenanceLog } from './entities/maintenance-log.entity';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { IMaintenanceLogsRepository } from './repositories/maintenance-logs.repository.interface';
import { TypeOrmMaintenanceLogsRepository } from './repositories/typeorm-maintenance-logs.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([MaintenanceLog, Drone]),
    AuditModule,
    WorkspaceContextModule,
  ],
  controllers: [MaintenanceController],
  providers: [
    MaintenanceService,
    {
      provide: IMaintenanceLogsRepository,
      useClass: TypeOrmMaintenanceLogsRepository,
    },
  ],
  exports: [MaintenanceService, IMaintenanceLogsRepository],
})
export class MaintenanceModule {}

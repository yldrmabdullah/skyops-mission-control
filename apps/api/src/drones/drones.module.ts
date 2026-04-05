import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { Drone } from './entities/drone.entity';
import { DronesController } from './drones.controller';
import { DronesService } from './drones.service';
import { IDronesRepository } from './repositories/drones.repository.interface';
import { TypeOrmDronesRepository } from './repositories/typeorm-drones.repository';
import { MissionsModule } from '../missions/missions.module';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { WorkspaceContextModule } from '../common/workspace-context/workspace-context.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Drone]),
    AuditModule,
    MissionsModule,
    MaintenanceModule,
    WorkspaceContextModule,
  ],
  controllers: [DronesController],
  providers: [
    DronesService,
    {
      provide: IDronesRepository,
      useClass: TypeOrmDronesRepository,
    },
  ],
  exports: [DronesService, IDronesRepository],
})
export class DronesModule {}

import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DronePersistenceModule } from './drone-persistence.module';
import { DronesController } from './drones.controller';
import { DronesService } from './drones.service';
import { MissionsModule } from '../missions/missions.module';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { WorkspaceContextModule } from '../common/workspace-context/workspace-context.module';

@Module({
  imports: [
    DronePersistenceModule,
    AuditModule,
    MissionsModule,
    MaintenanceModule,
    WorkspaceContextModule,
  ],
  controllers: [DronesController],
  providers: [DronesService],
  exports: [DronesService, DronePersistenceModule],
})
export class DronesModule {}

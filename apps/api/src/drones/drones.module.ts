import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { MaintenanceLog } from '../maintenance/entities/maintenance-log.entity';
import { Mission } from '../missions/entities/mission.entity';
import { Drone } from './entities/drone.entity';
import { DronesController } from './drones.controller';
import { DronesService } from './drones.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Drone, Mission, MaintenanceLog]),
    AuditModule,
  ],
  controllers: [DronesController],
  providers: [DronesService],
  exports: [DronesService, TypeOrmModule],
})
export class DronesModule {}

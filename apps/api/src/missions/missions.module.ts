import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { Drone } from '../drones/entities/drone.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { Mission } from './entities/mission.entity';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mission, Drone]),
    AuditModule,
    NotificationsModule,
  ],
  controllers: [MissionsController],
  providers: [MissionsService],
  exports: [MissionsService, TypeOrmModule],
})
export class MissionsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drone } from '../drones/entities/drone.entity';
import { Mission } from '../missions/entities/mission.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([Drone, Mission])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}

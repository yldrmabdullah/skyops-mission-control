import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Drone, DroneStatus } from './entities/drone.entity';

/**
 * Passive maintenance rule: drones that are due (50h / 90d) must flip to MAINTENANCE
 * even without mission activity. Runs daily; skips IN_MISSION so flight state stays consistent.
 */
@Injectable()
export class MaintenanceDueSchedulerService {
  private readonly logger = new Logger(MaintenanceDueSchedulerService.name);

  constructor(
    @InjectRepository(Drone)
    private readonly droneRepo: Repository<Drone>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    disabled: process.env.NODE_ENV === 'test',
  })
  async markIdleDronesDueForMaintenance(): Promise<void> {
    const result = await this.droneRepo
      .createQueryBuilder()
      .update(Drone)
      .set({ status: DroneStatus.MAINTENANCE })
      .where('status = :available', { available: DroneStatus.AVAILABLE })
      .andWhere(
        '(totalFlightHours - flightHoursAtLastMaintenance >= 50 OR nextMaintenanceDueDate <= CURRENT_TIMESTAMP)',
      )
      .execute();

    const affected = result.affected ?? 0;
    if (affected > 0) {
      this.logger.log(
        `Marked ${affected} drone(s) as MAINTENANCE (due by rule).`,
      );
    }
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Drone } from '../drones/entities/drone.entity';
import { isMaintenanceDue } from '../drones/utils/maintenance.utils';
import { Mission, MissionStatus } from '../missions/entities/mission.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Drone)
    private readonly dronesRepository: Repository<Drone>,
    @InjectRepository(Mission)
    private readonly missionsRepository: Repository<Mission>,
  ) {}

  async getFleetHealthReport() {
    const drones = await this.dronesRepository.find({
      order: { registeredAt: 'DESC' },
    });

    const totalCount = drones.length;
    const statusBreakdown = drones.reduce<Record<string, number>>(
      (acc, drone) => {
        acc[drone.status] = (acc[drone.status] ?? 0) + 1;
        return acc;
      },
      {},
    );

    const overdueMaintenance = drones.filter((drone) =>
      isMaintenanceDue({
        totalFlightHours: drone.totalFlightHours,
        flightHoursAtLastMaintenance: drone.flightHoursAtLastMaintenance,
        nextMaintenanceDueDate: drone.nextMaintenanceDueDate,
      }),
    );

    const now = new Date();
    const next24Hours = new Date(now);
    next24Hours.setUTCDate(next24Hours.getUTCDate() + 1);

    const upcomingMissions = await this.missionsRepository.count({
      where: {
        status: In([MissionStatus.PLANNED, MissionStatus.PRE_FLIGHT_CHECK]),
        plannedStart: Between(now, next24Hours),
      },
    });

    const averageFlightHoursPerDrone =
      totalCount === 0
        ? 0
        : Number(
            (
              drones.reduce((sum, drone) => sum + drone.totalFlightHours, 0) /
              totalCount
            ).toFixed(1),
          );

    return {
      totalDroneCount: totalCount,
      statusBreakdown,
      overdueMaintenance,
      missionsInNext24Hours: upcomingMissions,
      averageFlightHoursPerDrone,
    };
  }
}

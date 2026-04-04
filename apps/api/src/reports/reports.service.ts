import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Drone } from '../drones/entities/drone.entity';
import { isMaintenanceDue } from '../drones/utils/maintenance.utils';
import { MaintenanceLog } from '../maintenance/entities/maintenance-log.entity';
import { Mission, MissionStatus } from '../missions/entities/mission.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Drone)
    private readonly dronesRepository: Repository<Drone>,
    @InjectRepository(Mission)
    private readonly missionsRepository: Repository<Mission>,
    @InjectRepository(MaintenanceLog)
    private readonly maintenanceLogsRepository: Repository<MaintenanceLog>,
  ) {}

  async getFleetHealthReport(ownerId: string) {
    const drones = await this.dronesRepository.find({
      where: { ownerId },
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

    const droneIds = drones.map((d) => d.id);
    const upcomingMissions =
      droneIds.length === 0
        ? 0
        : await this.missionsRepository.count({
            where: {
              droneId: In(droneIds),
              status: In([
                MissionStatus.PLANNED,
                MissionStatus.PRE_FLIGHT_CHECK,
              ]),
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

  async getOperationalAnalytics(ownerId: string) {
    const drones = await this.dronesRepository.find({
      where: { ownerId },
      select: ['id', 'model'],
    });

    const droneModelBreakdown = drones.reduce<Record<string, number>>(
      (acc, drone) => {
        acc[drone.model] = (acc[drone.model] ?? 0) + 1;
        return acc;
      },
      {},
    );

    const droneIds = drones.map((d) => d.id);

    if (droneIds.length === 0) {
      return {
        missionStatusBreakdown: {} as Record<string, number>,
        droneModelBreakdown,
        maintenanceByTechnician: [] as {
          technicianName: string;
          count: number;
        }[],
      };
    }

    const missionRows = await this.missionsRepository
      .createQueryBuilder('m')
      .select('m.status', 'status')
      .addSelect('COUNT(*)', 'cnt')
      .where('m.droneId IN (:...ids)', { ids: droneIds })
      .groupBy('m.status')
      .getRawMany<{ status: string; cnt: string }>();

    const missionStatusBreakdown = Object.fromEntries(
      missionRows.map((row) => [row.status, parseInt(row.cnt, 10)]),
    );

    const maintRows = await this.maintenanceLogsRepository
      .createQueryBuilder('ml')
      .innerJoin('ml.drone', 'd')
      .select('ml.technicianName', 'technicianName')
      .addSelect('COUNT(*)', 'cnt')
      .where('d.ownerId = :ownerId', { ownerId })
      .groupBy('ml.technicianName')
      .orderBy('cnt', 'DESC')
      .getRawMany<{ technicianName: string; cnt: string }>();

    const maintenanceByTechnician = maintRows.map((row) => ({
      technicianName: row.technicianName,
      count: parseInt(row.cnt, 10),
    }));

    return {
      missionStatusBreakdown,
      droneModelBreakdown,
      maintenanceByTechnician,
    };
  }
}

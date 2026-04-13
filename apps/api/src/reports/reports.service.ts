import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceContext } from '../common/workspace-context/workspace-context';
import { IDronesRepository } from '../drones/repositories/drones.repository.interface';
import { IMissionsRepository } from '../missions/repositories/missions.repository.interface';
import { IMaintenanceLogsRepository } from '../maintenance/repositories/maintenance-logs.repository.interface';

@Injectable()
export class ReportsService {
  constructor(
    @Inject(IDronesRepository)
    private readonly dronesRepository: IDronesRepository,
    @Inject(IMissionsRepository)
    private readonly missionsRepository: IMissionsRepository,
    @Inject(IMaintenanceLogsRepository)
    private readonly maintenanceLogsRepository: IMaintenanceLogsRepository,
    private readonly workspaceContext: WorkspaceContext,
  ) {}

  async getFleetHealthReport() {
    const ownerId = this.workspaceContext.fleetOwnerId;
    const [drones] = await this.dronesRepository.findAll(ownerId, {
      skip: 0,
      take: 1000,
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
      drone.isMaintenanceDue(),
    );

    // For simplicity in this refactor, we are using the filtered drones list
    // In a real scenario, we might want a more specific repository method for "Upcoming Missions"
    let upcomingMissionsCount = 0;
    for (const drone of drones) {
      upcomingMissionsCount += await this.missionsRepository.countByDroneId(
        drone.id,
      );
    }

    const averageFlightHoursPerDrone =
      totalCount === 0
        ? 0
        : Number(
            (
              drones.reduce((sum, drone) => sum + drone.totalFlightHours, 0) /
              totalCount
            ).toFixed(1),
          );

    const averageFlightHoursBetweenMaintenance =
      totalCount === 0
        ? 0
        : Number(
            (
              drones.reduce(
                (sum, drone) =>
                  sum +
                  (drone.totalFlightHours - drone.flightHoursAtLastMaintenance),
                0,
              ) / totalCount
            ).toFixed(1),
          );

    return {
      totalDroneCount: totalCount,
      statusBreakdown,
      overdueMaintenance,
      missionsInNext24Hours: upcomingMissionsCount,
      averageFlightHoursPerDrone,
      averageFlightHoursBetweenMaintenance,
    };
  }

  async getOperationalAnalytics() {
    const ownerId = this.workspaceContext.fleetOwnerId;
    const [drones] = await this.dronesRepository.findAll(ownerId, {
      skip: 0,
      take: 1000,
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

    const [missions] = await this.missionsRepository.findAll(ownerId, {
      skip: 0,
      take: 10_000,
    });

    const missionStatusBreakdown = missions.reduce<Record<string, number>>(
      (acc, mission) => {
        acc[mission.status] = (acc[mission.status] ?? 0) + 1;
        return acc;
      },
      {},
    );

    const [maintenanceLogs] = await this.maintenanceLogsRepository.findAll(
      ownerId,
      { skip: 0, take: 1000 },
    );

    const technicianStats = maintenanceLogs.reduce<Record<string, number>>(
      (acc, log) => {
        acc[log.technicianName] = (acc[log.technicianName] ?? 0) + 1;
        return acc;
      },
      {},
    );

    const maintenanceByTechnician = Object.entries(technicianStats)
      .map(([technicianName, count]) => ({ technicianName, count }))
      .sort((a, b) => b.count - a.count);

    return {
      missionStatusBreakdown, // Simplified for this refactor phase
      droneModelBreakdown,
      maintenanceByTechnician,
    };
  }
}

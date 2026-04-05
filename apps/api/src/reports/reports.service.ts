import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceContext } from '../common/workspace-context/workspace-context';
import { IDronesRepository } from '../drones/repositories/drones.repository.interface';
import { IMissionsRepository } from '../missions/repositories/missions.repository.interface';
import { IMaintenanceLogsRepository } from '../maintenance/repositories/maintenance-logs.repository.interface';
import { Drone } from '../drones/entities/drone.entity';
import { Mission } from '../missions/entities/mission.entity';
import { ACTIVE_SCHEDULING_MISSION_STATUSES } from '../missions/entities/mission.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Drone)
    private readonly droneRepo: Repository<Drone>,
    @InjectRepository(Mission)
    private readonly missionRepo: Repository<Mission>,
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
    const now = new Date();
    const missionsWindowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const summary = await this.droneRepo
      .createQueryBuilder('d')
      .select('COUNT(d.id)', 'total')
      .addSelect('COALESCE(AVG(d.totalFlightHours), 0)', 'avgHours')
      .where('d.ownerId = :ownerId', { ownerId })
      .getRawOne<{ total: string; avgHours: string }>();

    const statusRows = await this.droneRepo
      .createQueryBuilder('d')
      .select('d.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('d.ownerId = :ownerId', { ownerId })
      .groupBy('d.status')
      .getRawMany<{ status: string; count: string }>();

    const overdueDrones = await this.droneRepo
      .createQueryBuilder('d')
      .where('d.ownerId = :ownerId', { ownerId })
      .andWhere(
        '(d.totalFlightHours - d.flightHoursAtLastMaintenance >= 50 OR d.nextMaintenanceDueDate <= :now)',
        { now },
      )
      .getMany();

    const missionsInNext24Hours = await this.missionRepo
      .createQueryBuilder('m')
      .innerJoin('m.drone', 'd')
      .where('d.ownerId = :ownerId', { ownerId })
      .andWhere('m.plannedStart >= :now', { now })
      .andWhere('m.plannedStart <= :missionsWindowEnd', { missionsWindowEnd })
      .andWhere('m.status IN (:...active)', {
        active: ACTIVE_SCHEDULING_MISSION_STATUSES,
      })
      .getCount();

    const totalDroneCount = Number(summary?.total ?? 0);
    const statusBreakdown = Object.fromEntries(
      statusRows.map((r) => [r.status, Number(r.count)]),
    );

    const averageFlightHoursPerDrone =
      totalDroneCount === 0
        ? 0
        : Number(Number(summary?.avgHours ?? 0).toFixed(1));

    return {
      totalDroneCount,
      statusBreakdown,
      overdueMaintenance: overdueDrones,
      missionsInNext24Hours,
      averageFlightHoursPerDrone,
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
      missionStatusBreakdown,
      droneModelBreakdown,
      maintenanceByTechnician,
    };
  }
}

import { DroneStatus } from '../drones/entities/drone.entity';
import { MissionStatus } from '../missions/entities/mission.entity';
import { ReportsService } from './reports.service';
import { IDronesRepository } from '../drones/repositories/drones.repository.interface';
import { IMissionsRepository } from '../missions/repositories/missions.repository.interface';
import { IMaintenanceLogsRepository } from '../maintenance/repositories/maintenance-logs.repository.interface';
import { WorkspaceContext } from '../common/workspace-context/workspace-context';
import type { Repository } from 'typeorm';
import type { Drone } from '../drones/entities/drone.entity';
import type { Mission } from '../missions/entities/mission.entity';

function queryBuilderStub(handlers: {
  getRawOne?: unknown;
  getRawMany?: unknown;
  getMany?: unknown;
  getCount?: unknown;
}) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawOne: jest
      .fn()
      .mockResolvedValue(
        handlers.getRawOne !== undefined ? handlers.getRawOne : {},
      ),
    getRawMany: jest
      .fn()
      .mockResolvedValue(
        handlers.getRawMany !== undefined ? handlers.getRawMany : [],
      ),
    getMany: jest
      .fn()
      .mockResolvedValue(
        handlers.getMany !== undefined ? handlers.getMany : [],
      ),
    getCount: jest
      .fn()
      .mockResolvedValue(
        handlers.getCount !== undefined ? handlers.getCount : 0,
      ),
  };
  return chain;
}

describe('ReportsService', () => {
  const mockWorkspaceContext = {
    fleetOwnerId: 'owner-1',
    userId: 'user-1',
  } as WorkspaceContext;

  it('builds the fleet health report summary', async () => {
    const summaryQb = queryBuilderStub({
      getRawOne: { total: '2', avgHours: '55.0' },
    });
    const statusQb = queryBuilderStub({
      getRawMany: [
        { status: 'AVAILABLE', count: '1' },
        { status: 'MAINTENANCE', count: '1' },
      ],
    });
    const overdueQb = queryBuilderStub({
      getMany: [
        {
          id: 'drone-2',
          status: DroneStatus.MAINTENANCE,
          totalFlightHours: 70,
          flightHoursAtLastMaintenance: 10,
        } as Drone,
      ],
    });
    const missionQb = queryBuilderStub({ getCount: 2 });

    let droneQbIndex = 0;
    const droneChains = [summaryQb, statusQb, overdueQb];
    const droneRepo = {
      createQueryBuilder: jest.fn(() => droneChains[droneQbIndex++]),
    } as unknown as Repository<Drone>;

    const missionRepo = {
      createQueryBuilder: jest.fn(() => missionQb),
    } as unknown as Repository<Mission>;

    const dronesRepository: Partial<IDronesRepository> = {
      findAll: jest.fn().mockResolvedValue([[], 0]),
    };

    const missionsRepository: Partial<IMissionsRepository> = {
      countByDroneId: jest.fn(),
    };

    const maintenanceLogsRepository: Partial<IMaintenanceLogsRepository> = {
      findAll: jest.fn().mockResolvedValue([[], 0]),
    };

    const service = new ReportsService(
      droneRepo,
      missionRepo,
      dronesRepository as IDronesRepository,
      missionsRepository as IMissionsRepository,
      maintenanceLogsRepository as IMaintenanceLogsRepository,
      mockWorkspaceContext,
    );

    const report = await service.getFleetHealthReport();

    expect(report.totalDroneCount).toBe(2);
    expect(report.statusBreakdown).toEqual({
      AVAILABLE: 1,
      MAINTENANCE: 1,
    });
    expect(report.missionsInNext24Hours).toBe(2);
    expect(report.overdueMaintenance).toHaveLength(1);
    expect(report.averageFlightHoursPerDrone).toBe(55);
  });

  it('returns operational analytics for the owner fleet', async () => {
    const droneRepo = {
      createQueryBuilder: jest.fn(),
    } as unknown as Repository<Drone>;
    const missionRepo = {
      createQueryBuilder: jest.fn(),
    } as unknown as Repository<Mission>;

    const dronesRepository: Partial<IDronesRepository> = {
      findAll: jest.fn().mockResolvedValue([
        [
          { id: 'd1', model: 'MATRICE_300' },
          { id: 'd2', model: 'MATRICE_300' },
        ],
        2,
      ]),
    };

    const missionsRepository: Partial<IMissionsRepository> = {
      countByDroneId: jest.fn().mockResolvedValue(0),
      findAll: jest
        .fn()
        .mockResolvedValue([
          [
            { status: MissionStatus.PLANNED },
            { status: MissionStatus.PLANNED },
            { status: MissionStatus.COMPLETED },
          ],
          3,
        ]),
    };

    const maintenanceLogsRepository: Partial<IMaintenanceLogsRepository> = {
      findAll: jest.fn().mockResolvedValue([[], 0]),
    };

    const service = new ReportsService(
      droneRepo,
      missionRepo,
      dronesRepository as IDronesRepository,
      missionsRepository as IMissionsRepository,
      maintenanceLogsRepository as IMaintenanceLogsRepository,
      mockWorkspaceContext,
    );

    const analytics = await service.getOperationalAnalytics();

    expect(analytics.droneModelBreakdown).toEqual({ MATRICE_300: 2 });
    expect(analytics.missionStatusBreakdown).toEqual({
      PLANNED: 2,
      COMPLETED: 1,
    });
  });
});

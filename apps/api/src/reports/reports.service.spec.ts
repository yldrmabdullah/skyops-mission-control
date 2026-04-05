import { DroneStatus } from '../drones/entities/drone.entity';
import { MissionStatus } from '../missions/entities/mission.entity';
import { ReportsService } from './reports.service';
import { IDronesRepository } from '../drones/repositories/drones.repository.interface';
import { IMissionsRepository } from '../missions/repositories/missions.repository.interface';
import { IMaintenanceLogsRepository } from '../maintenance/repositories/maintenance-logs.repository.interface';
import { WorkspaceContext } from '../common/workspace-context/workspace-context';

describe('ReportsService', () => {
  const mockWorkspaceContext = {
    fleetOwnerId: 'owner-1',
    userId: 'user-1',
  } as WorkspaceContext;

  it('builds the fleet health report summary', async () => {
    const dronesRepository: Partial<IDronesRepository> = {
      findAll: jest.fn().mockResolvedValue([
        [
          {
            id: 'drone-1',
            status: DroneStatus.AVAILABLE,
            totalFlightHours: 40,
            flightHoursAtLastMaintenance: 0,
            isMaintenanceDue: () => false,
            isMaintenanceWatchlistCandidate: () => false,
          },
          {
            id: 'drone-2',
            status: DroneStatus.MAINTENANCE,
            totalFlightHours: 70,
            flightHoursAtLastMaintenance: 10,
            isMaintenanceDue: () => true,
            isMaintenanceWatchlistCandidate: () => true,
          },
        ] as any[],
        2,
      ]),
    };

    const missionsRepository: Partial<IMissionsRepository> = {
      countByDroneId: jest.fn().mockResolvedValue(3),
    };

    const maintenanceLogsRepository: Partial<IMaintenanceLogsRepository> = {
      findAll: jest.fn().mockResolvedValue([[], 0]),
    };

    const service = new ReportsService(
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
  });

  it('returns operational analytics for the owner fleet', async () => {
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
      findAll: jest.fn().mockResolvedValue([
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

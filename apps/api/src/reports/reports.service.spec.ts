import { Repository } from 'typeorm';
import { Drone, DroneStatus } from '../drones/entities/drone.entity';
import { Mission } from '../missions/entities/mission.entity';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  it('builds the fleet health report summary', async () => {
    const dronesRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'drone-1',
          status: DroneStatus.AVAILABLE,
          totalFlightHours: 40,
          flightHoursAtLastMaintenance: 0,
          nextMaintenanceDueDate: new Date('2026-12-01T00:00:00.000Z'),
        },
        {
          id: 'drone-2',
          status: DroneStatus.MAINTENANCE,
          totalFlightHours: 70,
          flightHoursAtLastMaintenance: 10,
          nextMaintenanceDueDate: new Date('2026-01-01T00:00:00.000Z'),
        },
      ] satisfies Partial<Drone>[]),
    };

    const missionsRepository = {
      count: jest.fn().mockResolvedValue(3),
      createQueryBuilder: jest.fn(),
    };

    const maintenanceLogsRepository = {
      createQueryBuilder: jest.fn(),
    };

    const service = new ReportsService(
      dronesRepository as unknown as Repository<Drone>,
      missionsRepository as unknown as Repository<Mission>,
      maintenanceLogsRepository as never,
    );

    const report = await service.getFleetHealthReport('owner-1');

    expect(dronesRepository.find).toHaveBeenCalledWith({
      where: { ownerId: 'owner-1' },
      order: { registeredAt: 'DESC' },
    });

    expect(report.totalDroneCount).toBe(2);
    expect(report.statusBreakdown).toEqual({
      AVAILABLE: 1,
      MAINTENANCE: 1,
    });
    expect(report.overdueMaintenance).toHaveLength(1);
    expect(report.missionsInNext24Hours).toBe(3);
    expect(report.averageFlightHoursPerDrone).toBe(55);
  });

  it('returns operational analytics for the owner fleet', async () => {
    const dronesRepository = {
      find: jest.fn().mockResolvedValue([
        { id: 'd1', model: 'MATRICE_300' },
        { id: 'd2', model: 'MATRICE_300' },
      ]),
    };

    const missionQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ status: 'PLANNED', cnt: '2' }]),
    };

    const maintQb = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ technicianName: 'Alex', cnt: '3' }]),
    };

    const missionsRepository = {
      createQueryBuilder: jest.fn(() => missionQb),
    };

    const maintenanceLogsRepository = {
      createQueryBuilder: jest.fn(() => maintQb),
    };

    const service = new ReportsService(
      dronesRepository as unknown as Repository<Drone>,
      missionsRepository as unknown as Repository<Mission>,
      maintenanceLogsRepository as never,
    );

    const analytics = await service.getOperationalAnalytics('owner-1');

    expect(analytics.droneModelBreakdown).toEqual({ MATRICE_300: 2 });
    expect(analytics.missionStatusBreakdown).toEqual({ PLANNED: 2 });
    expect(analytics.maintenanceByTechnician).toEqual([
      { technicianName: 'Alex', count: 3 },
    ]);
  });
});

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
    };

    const service = new ReportsService(
      dronesRepository as unknown as Repository<Drone>,
      missionsRepository as unknown as Repository<Mission>,
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
});

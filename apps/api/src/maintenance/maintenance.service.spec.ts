import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Drone, DroneStatus } from '../drones/entities/drone.entity';
import { MaintenanceType } from './entities/maintenance-log.entity';
import { MaintenanceService } from './maintenance.service';
import { IDronesRepository } from '../drones/repositories/drones.repository.interface';
import { IMaintenanceLogsRepository } from './repositories/maintenance-logs.repository.interface';
import { WorkspaceContext } from '../common/workspace-context/workspace-context';

import {
  DroneInMissionException,
  FlightHourMismatchException,
} from './exceptions/maintenance-specific.exceptions';

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let dataSource: DataSource;
  let dronesRepository: IDronesRepository;

  const ownerId = '11111111-1111-4111-8111-111111111111';
  const droneId = '22222222-2222-4222-8222-222222222222';

  const mockWorkspaceContext = {
    fleetOwnerId: ownerId,
    userId: ownerId,
  };

  beforeEach(async () => {
    const drone: Partial<Drone> = {
      id: droneId,
      ownerId,
      status: DroneStatus.AVAILABLE,
      totalFlightHours: 40,
      flightHoursAtLastMaintenance: 0,
      lastMaintenanceDate: new Date('2026-01-01'),
      nextMaintenanceDueDate: new Date('2026-12-01'),
      serialNumber: 'SKY-TEST-0001',
    };

    dataSource = {
      transaction: jest.fn(
        async (
          fn: (m: {
            save: (e: unknown) => Promise<unknown>;
          }) => Promise<unknown>,
        ) => {
          const manager = {
            save: jest.fn((entity: unknown) => Promise.resolve(entity)),
          };
          return fn(manager);
        },
      ),
    } as unknown as DataSource;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceService,
        { provide: DataSource, useValue: dataSource },
        {
          provide: IMaintenanceLogsRepository,
          useValue: {
            create: jest.fn((payload: Record<string, unknown>) => ({
              ...payload,
              id: 'log-1',
            })),
            findAll: jest.fn().mockResolvedValue([[], 0]),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: IDronesRepository,
          useValue: {
            findOne: jest.fn().mockResolvedValue(drone),
          },
        },
        {
          provide: AuditService,
          useValue: { record: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: WorkspaceContext,
          useValue: mockWorkspaceContext,
        },
      ],
    }).compile();

    service = module.get(MaintenanceService);
    dronesRepository = module.get(IDronesRepository);
  });

  it('persists drone and log in a single transaction on create', async () => {
    await service.create({
      droneId,
      type: MaintenanceType.ROUTINE_CHECK,
      technicianName: 'Tech',
      performedAt: new Date().toISOString(),
      flightHoursAtMaintenance: 40,
    });

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('should throw DroneInMissionException when drone is IN_MISSION', async () => {
    const inMissionDrone = {
      id: droneId,
      ownerId,
      status: DroneStatus.IN_MISSION,
      totalFlightHours: 40,
    } as Drone;
    jest.spyOn(dronesRepository, 'findOne').mockResolvedValue(inMissionDrone);

    await expect(
      service.create({
        droneId,
        type: MaintenanceType.ROUTINE_CHECK,
        technicianName: 'Tech',
        performedAt: new Date().toISOString(),
        flightHoursAtMaintenance: 40,
      }),
    ).rejects.toThrow(DroneInMissionException);
  });

  it('should throw FlightHourMismatchException if flight hours do not match total flight hours', async () => {
    const droneWith40Hours = {
      id: droneId,
      ownerId,
      status: DroneStatus.AVAILABLE,
      totalFlightHours: 40,
    } as Drone;
    jest.spyOn(dronesRepository, 'findOne').mockResolvedValue(droneWith40Hours);

    await expect(
      service.create({
        droneId,
        type: MaintenanceType.ROUTINE_CHECK,
        technicianName: 'Tech',
        performedAt: new Date().toISOString(),
        flightHoursAtMaintenance: 45, // Exceeds tolerance
      }),
    ).rejects.toThrow(FlightHourMismatchException);
  });
});

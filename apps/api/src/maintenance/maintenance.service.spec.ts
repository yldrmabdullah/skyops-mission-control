import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Drone, DroneStatus } from '../drones/entities/drone.entity';
import {
  MaintenanceLog,
  MaintenanceType,
} from './entities/maintenance-log.entity';
import { MaintenanceService } from './maintenance.service';

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let dataSource: { transaction: jest.Mock };
  let dronesRepository: { findOne: jest.Mock };
  let maintenanceLogsRepository: { create: jest.Mock };

  const ownerId = '11111111-1111-4111-8111-111111111111';
  const droneId = '22222222-2222-4222-8222-222222222222';

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
        async (fn: (m: { save: jest.Mock }) => Promise<unknown>) => {
          const manager = {
            save: jest.fn((entity: unknown) => Promise.resolve(entity)),
          };
          return fn(manager);
        },
      ),
    };

    dronesRepository = {
      findOne: jest.fn().mockResolvedValue(drone),
    };

    maintenanceLogsRepository = {
      create: jest.fn((payload: unknown) => ({
        ...(payload as object),
        id: 'log-new',
        droneId,
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceService,
        { provide: DataSource, useValue: dataSource },
        {
          provide: getRepositoryToken(MaintenanceLog),
          useValue: {
            ...maintenanceLogsRepository,
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Drone),
          useValue: dronesRepository,
        },
        {
          provide: AuditService,
          useValue: { record: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(MaintenanceService);
  });

  it('persists drone and log in a single transaction on create', async () => {
    await service.create(
      {
        droneId,
        type: MaintenanceType.ROUTINE_CHECK,
        technicianName: 'Tech',
        performedAt: new Date().toISOString(),
        flightHoursAtMaintenance: 40,
      },
      ownerId,
      ownerId,
    );

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });
});

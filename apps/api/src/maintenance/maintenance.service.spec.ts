import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Drone, DroneStatus } from '../drones/entities/drone.entity';
import {
  MaintenanceLog,
  MaintenanceType,
} from './entities/maintenance-log.entity';
import { MaintenanceService } from './maintenance.service';
import { IDronesRepository } from '../drones/repositories/drones.repository.interface';
import { IMaintenanceLogsRepository } from './repositories/maintenance-logs.repository.interface';
import { WorkspaceContext } from '../common/workspace-context/workspace-context';

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let dataSource: any;

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
        async (fn: (m: { save: jest.Mock }) => Promise<unknown>) => {
          const manager = {
            save: jest.fn((entity: unknown) => Promise.resolve(entity)),
          };
          return fn(manager as any);
        },
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceService,
        { provide: DataSource, useValue: dataSource },
        {
          provide: IMaintenanceLogsRepository,
          useValue: {
            create: jest.fn((payload: any) => ({ ...payload, id: 'log-1' })),
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
});

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { OperatorRole } from '../auth/operator-role.enum';
import { WorkspaceContext } from '../common/workspace-context/workspace-context';
import {
  DroneListSortField,
  DroneListSortOrder,
} from './dto/drone-list-sort.enum';
import { DronesService } from './drones.service';
import { Drone, DroneModel, DroneStatus } from './entities/drone.entity';
import { IDronesRepository } from './repositories/drones.repository.interface';
import { IMissionsRepository } from '../missions/repositories/missions.repository.interface';
import { IMaintenanceLogsRepository } from '../maintenance/repositories/maintenance-logs.repository.interface';

describe('DronesService', () => {
  let service: DronesService;
  let dronesRepository: IDronesRepository;

  const mockDrone: Drone = {
    id: 'drone-1',
    serialNumber: 'SN001-A',
    model: DroneModel.MAVIC_3_ENTERPRISE,
    status: DroneStatus.AVAILABLE,
    totalFlightHours: 10,
    flightHoursAtLastMaintenance: 0,
    lastMaintenanceDate: new Date(),
    nextMaintenanceDueDate: new Date(),
    ownerId: 'user-1',
    registeredAt: new Date(),
    missions: [],
    maintenanceLogs: [],
    isMaintenanceDue: jest.fn().mockReturnValue(false),
    isMaintenanceWatchlistCandidate: jest.fn().mockReturnValue(false),
  } as unknown as Drone;

  const mockWorkspaceContext = {
    fleetOwnerId: 'user-1',
    userId: 'user-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DronesService,
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(),
          },
        },
        {
          provide: IDronesRepository,
          useValue: {
            findOne: jest.fn(),
            findBySerialNumber: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: IMissionsRepository,
          useValue: {
            findOne: jest.fn(),
            countByDroneId: jest.fn(),
          },
        },
        {
          provide: IMaintenanceLogsRepository,
          useValue: {
            countByDroneId: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            record: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: WorkspaceContext,
          useValue: mockWorkspaceContext,
        },
      ],
    }).compile();

    service = module.get<DronesService>(DronesService);
    dronesRepository = module.get<IDronesRepository>(IDronesRepository);
  });

  describe('create', () => {
    it('should successfully create a new drone', async () => {
      jest.spyOn(dronesRepository, 'findBySerialNumber').mockResolvedValue(null);
      jest.spyOn(dronesRepository, 'create').mockReturnValue(mockDrone);
      jest.spyOn(dronesRepository, 'save').mockResolvedValue(mockDrone);

      const result = await service.create({
        serialNumber: 'SN001-A',
        model: DroneModel.MAVIC_3_ENTERPRISE,
        lastMaintenanceDate: new Date().toISOString(),
        totalFlightHours: 0,
      });

      expect(result.serialNumber).toBe(mockDrone.serialNumber);
    });
  });

  describe('findOne', () => {
    it('strips maintenance logs for pilots', async () => {
      const withLogs = {
        ...mockDrone,
        maintenanceLogs: [{ id: 'log-1' }],
      } as Drone;
      jest.spyOn(dronesRepository, 'findOne').mockResolvedValue(withLogs);

      const result = await service.findOne('drone-1', OperatorRole.PILOT);

      expect(result.maintenanceLogs).toEqual([]);
    });

    it('returns maintenance logs for technicians', async () => {
      const withLogs = {
        ...mockDrone,
        maintenanceLogs: [{ id: 'log-1' }],
      } as Drone;
      jest.spyOn(dronesRepository, 'findOne').mockResolvedValue(withLogs);

      const result = await service.findOne('drone-1', OperatorRole.TECHNICIAN);

      expect(result.maintenanceLogs).toEqual([{ id: 'log-1' }]);
    });
  });

  describe('findAll', () => {
    it('should return a list of drones with metadata', async () => {
      jest.spyOn(dronesRepository, 'findAll').mockResolvedValue([[mockDrone], 1]);
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('update', () => {
    it('should throw BadRequestException when trying to set status to AVAILABLE while maintenance is due', async () => {
      const overdueDrone = {
        ...mockDrone,
        totalFlightHours: 60,
        flightHoursAtLastMaintenance: 0,
        status: DroneStatus.MAINTENANCE,
        isMaintenanceDue: () => true,
      } as Drone;

      jest.spyOn(dronesRepository, 'findOne').mockResolvedValue(overdueDrone);

      await expect(
        service.update('drone-1', { status: DroneStatus.AVAILABLE }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow updating other fields if status is not changing to AVAILABLE', async () => {
      const drone = { 
        ...mockDrone,
        isMaintenanceDue: () => false,
      } as Drone;
      jest.spyOn(dronesRepository, 'findOne').mockResolvedValue(drone);
      jest.spyOn(dronesRepository, 'save').mockResolvedValue(drone);

      const result = await service.update('drone-1', {
        model: DroneModel.MATRICE_300,
      });

      expect(result.model).toBe(DroneModel.MATRICE_300);
    });
  });
});

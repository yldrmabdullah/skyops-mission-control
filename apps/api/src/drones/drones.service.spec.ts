import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { OperatorRole } from '../auth/operator-role.enum';
import { MaintenanceLog } from '../maintenance/entities/maintenance-log.entity';
import { Mission } from '../missions/entities/mission.entity';
import {
  DroneListSortField,
  DroneListSortOrder,
} from './dto/drone-list-sort.enum';
import { DronesService } from './drones.service';
import { Drone, DroneModel, DroneStatus } from './entities/drone.entity';

describe('DronesService', () => {
  let service: DronesService;
  let dronesRepository: Repository<Drone>;

  const ownerId = 'user-1';
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
  } as unknown as Drone;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DronesService,
        {
          provide: getRepositoryToken(Drone),
          useValue: {
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Mission),
          useValue: {
            findOne: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(MaintenanceLog),
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            record: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<DronesService>(DronesService);
    dronesRepository = module.get<Repository<Drone>>(getRepositoryToken(Drone));
  });

  describe('create', () => {
    it('should successfully create a new drone', async () => {
      jest.spyOn(dronesRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(dronesRepository, 'create').mockReturnValue(mockDrone);
      jest.spyOn(dronesRepository, 'save').mockResolvedValue(mockDrone);

      const result = await service.create(
        {
          serialNumber: 'SN001-A',
          model: DroneModel.MAVIC_3_ENTERPRISE,
          lastMaintenanceDate: new Date().toISOString(),
          totalFlightHours: 0,
        },
        ownerId,
        ownerId,
      );

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

      const result = await service.findOne(
        'drone-1',
        ownerId,
        OperatorRole.PILOT,
      );

      expect(result.maintenanceLogs).toEqual([]);
    });

    it('returns maintenance logs for technicians', async () => {
      const withLogs = {
        ...mockDrone,
        maintenanceLogs: [{ id: 'log-1' }],
      } as Drone;
      jest.spyOn(dronesRepository, 'findOne').mockResolvedValue(withLogs);

      const result = await service.findOne(
        'drone-1',
        ownerId,
        OperatorRole.TECHNICIAN,
      );

      expect(result.maintenanceLogs).toEqual([{ id: 'log-1' }]);
    });
  });

  describe('findAll', () => {
    it('should return a list of drones with metadata', async () => {
      jest
        .spyOn(dronesRepository, 'findAndCount')
        .mockResolvedValue([[mockDrone], 1]);
      const result = await service.findAll({ page: 1, limit: 10 }, ownerId);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.data[0]).toHaveProperty('maintenanceDue');
      expect(result.data[0]).toHaveProperty('maintenanceWatchlist');
      expect(dronesRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { registeredAt: 'DESC' },
        }),
      );
    });

    it('should order by requested column', async () => {
      jest
        .spyOn(dronesRepository, 'findAndCount')
        .mockResolvedValue([[mockDrone], 1]);
      await service.findAll(
        {
          page: 1,
          limit: 10,
          sortBy: DroneListSortField.SERIAL_NUMBER,
          sortOrder: DroneListSortOrder.ASC,
        },
        ownerId,
      );
      expect(dronesRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { serialNumber: 'ASC' },
        }),
      );
    });
  });

  describe('update', () => {
    it('should throw BadRequestException when trying to set status to AVAILABLE while maintenance is due', async () => {
      // Setup a drone that needs maintenance (60h > 50h threshold)
      const overdueDrone = {
        ...mockDrone,
        totalFlightHours: 60,
        flightHoursAtLastMaintenance: 0,
        status: DroneStatus.MAINTENANCE,
      } as Drone;

      jest.spyOn(dronesRepository, 'findOne').mockResolvedValue(overdueDrone);

      await expect(
        service.update('drone-1', { status: DroneStatus.AVAILABLE }, ownerId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow updating other fields if status is not changing to AVAILABLE', async () => {
      const drone = { ...mockDrone };
      jest.spyOn(dronesRepository, 'findOne').mockResolvedValue(drone);
      jest.spyOn(dronesRepository, 'save').mockResolvedValue(drone);

      const result = await service.update(
        'drone-1',
        { model: DroneModel.MATRICE_300 },
        ownerId,
      );

      expect(result.model).toBe(DroneModel.MATRICE_300);
    });
  });
});

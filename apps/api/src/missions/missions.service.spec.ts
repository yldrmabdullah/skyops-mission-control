import { DataSource, Repository } from 'typeorm';
import {
  Drone,
  DroneModel,
  DroneStatus,
} from '../drones/entities/drone.entity';
import { Mission, MissionStatus, MissionType } from './entities/mission.entity';
import {
  MissionListSortField,
  MissionListSortOrder,
} from './dto/mission-list-sort.enum';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { MissionsService } from './missions.service';
import { DomainException } from '../common/exceptions/domain.exception';
import {
  DroneNotAvailableException,
  MissionNotFoundException,
  MissionOverlapException,
} from './exceptions/mission-specific.exceptions';

const OWNER_ID = '11111111-1111-4111-8111-111111111111';

/** For testing private `assertNoOverlap` without `as any`. */
interface MissionsServicePrivate {
  assertNoOverlap(
    droneId: string,
    plannedStart: Date,
    plannedEnd: Date,
    options?: { excludeMissionId?: string; ownerIdForNotify?: string },
  ): Promise<void>;
}

function createMissionRepositoryMock() {
  const queryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };

  return {
    findOne: jest.fn(),
    create: jest.fn((payload: Partial<Mission>) => payload),
    save: jest.fn((payload: Mission) => Promise.resolve(payload)),
    createQueryBuilder: jest.fn(() => queryBuilder),
    __queryBuilder: queryBuilder,
  };
}

function createDroneRepositoryMock() {
  return {
    findOne: jest.fn(),
    save: jest.fn((payload: Drone) => Promise.resolve(payload)),
  };
}

describe('MissionsService', () => {
  let missionsRepository: ReturnType<typeof createMissionRepositoryMock>;
  let dronesRepository: ReturnType<typeof createDroneRepositoryMock>;
  let auditService: { record: jest.Mock };
  let notificationsService: {
    notifyScheduleConflictIfEnabled: jest.Mock;
    notifyMaintenanceDueStub: jest.Mock;
  };
  let service: MissionsService;

  beforeEach(() => {
    missionsRepository = createMissionRepositoryMock();
    dronesRepository = createDroneRepositoryMock();
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    notificationsService = {
      notifyScheduleConflictIfEnabled: jest.fn().mockResolvedValue(undefined),
      notifyMaintenanceDueStub: jest.fn().mockResolvedValue(undefined),
    };
    const dataSource = {
      transaction: jest.fn(
        async (fn: (m: { save: jest.Mock }) => Promise<Mission>) => {
          const manager = {
            save: jest.fn((_target: unknown, entity?: unknown) =>
              Promise.resolve((entity ?? _target) as Mission),
            ),
          };
          return fn(manager);
        },
      ),
    };
    service = new MissionsService(
      dataSource as unknown as DataSource,
      missionsRepository as unknown as Repository<Mission>,
      dronesRepository as unknown as Repository<Drone>,
      auditService as unknown as AuditService,
      notificationsService as unknown as NotificationsService,
    );
  });

  describe('create', () => {
    it('creates a mission successfully and records audit', async () => {
      const drone = {
        id: 'drone-1',
        ownerId: OWNER_ID,
        status: DroneStatus.AVAILABLE,
      } as Drone;
      dronesRepository.findOne.mockResolvedValue(drone);
      missionsRepository.__queryBuilder.getOne.mockResolvedValue(null);

      const dto = {
        name: 'Test Mission',
        type: MissionType.WIND_TURBINE_INSPECTION,
        droneId: 'drone-1',
        pilotName: 'Pilot X',
        siteLocation: 'Site A',
        plannedStart: new Date(Date.now() + 100000).toISOString(),
        plannedEnd: new Date(Date.now() + 200000).toISOString(),
      };

      const result = await service.create(dto, OWNER_ID, 'user-1');
      expect(result.status).toBe(MissionStatus.PLANNED);
      expect(missionsRepository.save).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
    });

    it('rejects mission creation when the drone is not available', async () => {
      dronesRepository.findOne.mockResolvedValue({
        id: 'drone-1',
        ownerId: OWNER_ID,
        status: DroneStatus.MAINTENANCE,
      } as Drone);

      await expect(
        service.create(
          {
            name: 'Wind inspection',
            type: MissionType.WIND_TURBINE_INSPECTION,
            droneId: 'drone-1',
            pilotName: 'Jane Doe',
            siteLocation: 'Berlin, Germany',
            plannedStart: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            plannedEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          },
          OWNER_ID,
          OWNER_ID,
        ),
      ).rejects.toThrow(DroneNotAvailableException);
    });

    it('rejects mission creation when an overlapping mission exists and user is notified', async () => {
      dronesRepository.findOne.mockResolvedValue({
        id: 'drone-1',
        ownerId: OWNER_ID,
        status: DroneStatus.AVAILABLE,
      } as Drone);
      missionsRepository.__queryBuilder.getOne.mockResolvedValue({
        id: 'overlap',
      });

      await expect(
        service.create(
          {
            name: 'Overlap mission',
            type: MissionType.WIND_TURBINE_INSPECTION,
            droneId: 'drone-1',
            pilotName: 'Jane Doe',
            siteLocation: 'Berlin, Germany',
            plannedStart: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            plannedEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          },
          OWNER_ID,
          OWNER_ID,
        ),
      ).rejects.toThrow(MissionOverlapException);

      expect(
        notificationsService.notifyScheduleConflictIfEnabled,
      ).toHaveBeenCalled();
    });

    it('rejects missions planned in the past', async () => {
      dronesRepository.findOne.mockResolvedValue({
        id: 'drone-1',
        ownerId: OWNER_ID,
        status: DroneStatus.AVAILABLE,
      } as Drone);
      await expect(
        service.create(
          {
            name: 'Past mission',
            type: MissionType.WIND_TURBINE_INSPECTION,
            droneId: 'drone-1',
            pilotName: 'Jane',
            siteLocation: 'Loc',
            plannedStart: new Date(Date.now() - 10000).toISOString(),
            plannedEnd: new Date(Date.now() + 10000).toISOString(),
          },
          OWNER_ID,
          OWNER_ID,
        ),
      ).rejects.toThrow(DomainException);
    });
  });

  describe('findAll', () => {
    it('returns paginated missions and applies all filters', async () => {
      const start = new Date('2026-04-01T10:00:00Z');
      const end = new Date('2026-04-01T12:00:00Z');

      await service.findAll(
        {
          page: 2,
          limit: 10,
          status: MissionStatus.PLANNED,
          droneId: 'drone-123',
          search: 'Jane',
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
        OWNER_ID,
      );

      const qb = missionsRepository.__queryBuilder;
      expect(qb.orderBy).toHaveBeenCalledWith('mission.plannedStart', 'ASC');
      expect(qb.addOrderBy).toHaveBeenCalledWith('mission.id', 'ASC');
      expect(qb.skip).toHaveBeenCalledWith(10);
      expect(qb.take).toHaveBeenCalledWith(10);
      // Verify filters were called
      expect(qb.andWhere).toHaveBeenCalledWith(
        'mission.status = :status',
        expect.anything(),
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'mission.droneId = :droneId',
        expect.anything(),
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(mission.name ILIKE :search OR mission.pilotName ILIKE :search)',
        expect.anything(),
      );
    });

    it('throws if startDate is after endDate', async () => {
      await expect(
        service.findAll(
          {
            page: 1,
            limit: 5,
            startDate: '2026-04-02T00:00:00Z',
            endDate: '2026-04-01T00:00:00Z',
          },
          OWNER_ID,
        ),
      ).rejects.toThrow();
    });

    it('orders by requested column and direction', async () => {
      await service.findAll(
        {
          page: 1,
          limit: 10,
          sortBy: MissionListSortField.NAME,
          sortOrder: MissionListSortOrder.DESC,
        },
        OWNER_ID,
      );

      const qb = missionsRepository.__queryBuilder;
      expect(qb.orderBy).toHaveBeenCalledWith('mission.name', 'DESC');
      expect(qb.addOrderBy).toHaveBeenCalledWith('mission.id', 'ASC');
    });
  });

  describe('transition', () => {
    it('successfully transitions to PRE_FLIGHT_CHECK', async () => {
      const mission = {
        id: 'm1',
        status: MissionStatus.PLANNED,
        droneId: 'd1',
      } as Mission;
      missionsRepository.findOne.mockResolvedValue(mission);
      dronesRepository.findOne.mockResolvedValue({ id: 'd1' } as Drone);

      const result = await service.transition(
        'm1',
        { status: MissionStatus.PRE_FLIGHT_CHECK },
        OWNER_ID,
        'u1',
      );
      expect(result.status).toBe(MissionStatus.PRE_FLIGHT_CHECK);
    });

    it('rejects moving to in progress when the drone is not available', async () => {
      missionsRepository.findOne.mockResolvedValue({
        id: 'mission-1',
        droneId: 'drone-1',
        status: MissionStatus.PRE_FLIGHT_CHECK,
        drone: { ownerId: OWNER_ID },
      } as Mission);
      dronesRepository.findOne.mockResolvedValue({
        id: 'drone-1',
        ownerId: OWNER_ID,
        status: DroneStatus.MAINTENANCE,
      } as Drone);

      await expect(
        service.transition(
          'mission-1',
          { status: MissionStatus.IN_PROGRESS },
          OWNER_ID,
          OWNER_ID,
        ),
      ).rejects.toThrow(DroneNotAvailableException);
    });

    it('rejects transition to the same status', async () => {
      missionsRepository.findOne.mockResolvedValue({
        id: 'mission-1',
        droneId: 'drone-1',
        status: MissionStatus.PLANNED,
        drone: { ownerId: OWNER_ID },
      } as Mission);
      dronesRepository.findOne.mockResolvedValue({
        id: 'drone-1',
        ownerId: OWNER_ID,
        status: DroneStatus.AVAILABLE,
      } as Drone);

      await expect(
        service.transition(
          'mission-1',
          { status: MissionStatus.PLANNED },
          OWNER_ID,
          OWNER_ID,
        ),
      ).rejects.toThrow(DomainException);
    });

    it('requires an abort reason when aborting a mission', async () => {
      missionsRepository.findOne.mockResolvedValue({
        id: 'm1',
        status: MissionStatus.IN_PROGRESS,
        droneId: 'd1',
      } as Mission);
      dronesRepository.findOne.mockResolvedValue({
        id: 'd1',
        status: DroneStatus.IN_MISSION,
      } as Drone);

      await expect(
        service.transition(
          'm1',
          { status: MissionStatus.ABORTED, abortReason: ' ' },
          OWNER_ID,
          'u1',
        ),
      ).rejects.toThrow(DomainException);
    });

    it('successfully aborts a mission with valid reason and actual start', async () => {
      const start = new Date('2026-01-01T10:00:00Z');
      const end = new Date('2026-01-01T11:00:00Z');
      const mission = {
        id: 'm1',
        status: MissionStatus.IN_PROGRESS,
        droneId: 'd1',
        actualStart: start,
      } as Mission;
      missionsRepository.findOne.mockResolvedValue(mission);
      dronesRepository.findOne.mockResolvedValue({
        id: 'd1',
        status: DroneStatus.IN_MISSION,
      } as Drone);

      const result = await service.transition(
        'm1',
        {
          status: MissionStatus.ABORTED,
          abortReason: 'Weather',
          actualEnd: end.toISOString(),
        },
        OWNER_ID,
        'u1',
      );
      expect(result.status).toBe(MissionStatus.ABORTED);
      expect(result.abortReason).toBe('Weather');
    });

    it('rejects completing a mission if actualEnd is before actualStart', async () => {
      const start = new Date();
      const end = new Date(start.getTime() - 1000); // 1s before start
      const mission = {
        id: 'mission-1',
        droneId: 'drone-1',
        status: MissionStatus.IN_PROGRESS,
        actualStart: start,
        drone: { ownerId: OWNER_ID },
      } as Mission;

      missionsRepository.findOne.mockResolvedValue(mission);
      dronesRepository.findOne.mockResolvedValue({ id: 'drone-1' } as Drone);

      await expect(
        service.transition(
          'mission-1',
          {
            status: MissionStatus.COMPLETED,
            actualEnd: end.toISOString(),
            flightHoursLogged: 1,
          },
          OWNER_ID,
          OWNER_ID,
        ),
      ).rejects.toThrow();
    });

    it('rejects completing a mission if flightHoursLogged is missing', async () => {
      missionsRepository.findOne.mockResolvedValue({
        status: MissionStatus.IN_PROGRESS,
        droneId: 'd1',
      } as Mission);
      dronesRepository.findOne.mockResolvedValue({ id: 'd1' } as Drone);
      await expect(
        service.transition(
          'm1',
          { status: MissionStatus.COMPLETED },
          OWNER_ID,
          'u1',
        ),
      ).rejects.toThrow(DomainException);
    });

    it('throws when transitioning a missing mission', async () => {
      missionsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.transition(
          'missing',
          {
            status: MissionStatus.PRE_FLIGHT_CHECK,
          },
          OWNER_ID,
          OWNER_ID,
        ),
      ).rejects.toThrow(MissionNotFoundException);
    });
  });

  describe('update', () => {
    it('rejects mission update when the next drone is unavailable', async () => {
      missionsRepository.findOne.mockResolvedValue({
        id: 'mission-1',
        droneId: 'drone-1',
        status: MissionStatus.PLANNED,
        plannedStart: new Date(Date.now() + 60 * 60 * 1000),
        plannedEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
        drone: { ownerId: OWNER_ID },
      } as Mission);
      dronesRepository.findOne.mockResolvedValue({
        id: 'drone-2',
        ownerId: OWNER_ID,
        status: DroneStatus.MAINTENANCE,
      } as Drone);
      missionsRepository.__queryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.update(
          'mission-1',
          {
            droneId: 'drone-2',
          },
          OWNER_ID,
        ),
      ).rejects.toThrow(DroneNotAvailableException);
    });

    it('throws when reassigning a mission to a missing drone', async () => {
      missionsRepository.findOne.mockResolvedValue({
        id: 'mission-1',
        droneId: 'drone-1',
        status: MissionStatus.PLANNED,
        plannedStart: new Date(Date.now() + 60 * 60 * 1000),
        plannedEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
        drone: { ownerId: OWNER_ID },
      } as Mission);
      dronesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(
          'mission-1',
          {
            droneId: 'missing-drone',
          },
          OWNER_ID,
        ),
      ).rejects.toThrow(DomainException);
    });

    it('rejects updating non-planned mission', async () => {
      missionsRepository.findOne.mockResolvedValue({
        status: MissionStatus.IN_PROGRESS,
      } as Mission);
      await expect(
        service.update('m1', { name: 'New' }, OWNER_ID),
      ).rejects.toThrow(DomainException);
    });

    it('rejects invalid end date before start date', async () => {
      const mission = {
        id: 'm1',
        status: MissionStatus.PLANNED,
        plannedStart: new Date(Date.now() + 10000),
        plannedEnd: new Date(Date.now() + 20000),
      } as Mission;
      missionsRepository.findOne.mockResolvedValue(mission);
      await expect(
        service.update(
          'm1',
          { plannedEnd: new Date(Date.now() + 5000).toISOString() },
          OWNER_ID,
        ),
      ).rejects.toThrow(DomainException);
    });
  });

  describe('completing a mission and maintenance trigger', () => {
    it('completes mission, updates drone and notifies maintenance', async () => {
      const mission = {
        id: 'mission-1',
        droneId: 'drone-1',
        status: MissionStatus.IN_PROGRESS,
        drone: { ownerId: OWNER_ID },
      } as Mission;
      const drone = {
        id: 'drone-1',
        ownerId: OWNER_ID,
        serialNumber: 'SN001',
        model: DroneModel.MATRICE_300,
        status: DroneStatus.IN_MISSION,
        totalFlightHours: 49,
        flightHoursAtLastMaintenance: 0,
        lastMaintenanceDate: new Date('2026-01-01T00:00:00.000Z'),
        nextMaintenanceDueDate: new Date('2026-12-01T00:00:00.000Z'),
      } as Drone;

      missionsRepository.findOne.mockResolvedValue(mission);
      dronesRepository.findOne.mockResolvedValue(drone);

      const result = await service.transition(
        'mission-1',
        {
          status: MissionStatus.COMPLETED,
          flightHoursLogged: 2,
        },
        OWNER_ID,
        OWNER_ID,
      );

      expect(result.status).toBe(MissionStatus.COMPLETED);
      expect(drone.totalFlightHours).toBe(51);
      expect(
        notificationsService.notifyMaintenanceDueStub,
      ).toHaveBeenCalledWith(OWNER_ID, 'SN001');
    });

    it('successfully transitions to a status that uses generic persist', async () => {
      const mission = {
        id: 'm1',
        status: MissionStatus.PLANNED,
        droneId: 'd1',
      } as Mission;
      missionsRepository.findOne.mockResolvedValue(mission);
      dronesRepository.findOne.mockResolvedValue({ id: 'd1' } as Drone);

      const result = await service.transition(
        'm1',
        { status: MissionStatus.PRE_FLIGHT_CHECK },
        OWNER_ID,
        'u1',
      );
      expect(result.status).toBe(MissionStatus.PRE_FLIGHT_CHECK);
      expect(auditService.record).toHaveBeenCalled();
    });
  });

  describe('Internal logic edge cases', () => {
    it('findAll works without search term', async () => {
      await service.findAll({ page: 1, limit: 10 }, OWNER_ID);
      expect(
        missionsRepository.__queryBuilder.andWhere,
      ).not.toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.any(Object),
      );
    });

    it('update avoids drone validation if droneId is same', async () => {
      const mission = {
        id: 'm1',
        droneId: 'd1',
        status: MissionStatus.PLANNED,
        plannedStart: new Date(),
        plannedEnd: new Date(),
      } as Mission;
      missionsRepository.findOne.mockResolvedValue(mission);
      missionsRepository.__queryBuilder.getOne.mockResolvedValue(null);

      await service.update('m1', { name: 'New' }, OWNER_ID);
      expect(dronesRepository.findOne).not.toHaveBeenCalled();
    });

    it('assertNoOverlap excludes current mission during update', async () => {
      const mission = {
        id: 'm1',
        droneId: 'd1',
        status: MissionStatus.PLANNED,
        plannedStart: new Date(),
        plannedEnd: new Date(),
      } as Mission;
      missionsRepository.findOne.mockResolvedValue(mission);
      missionsRepository.__queryBuilder.getOne.mockResolvedValue(null);

      await service.update('m1', { name: 'New' }, OWNER_ID);
      expect(missionsRepository.__queryBuilder.andWhere).toHaveBeenCalledWith(
        'mission.id != :excludeMissionId',
        { excludeMissionId: 'm1' },
      );
    });

    it('assertNoOverlap throws without notification if ownerIdForNotify is missing', async () => {
      missionsRepository.__queryBuilder.getOne.mockResolvedValue({
        id: 'overlap',
      });
      const privateSvc = service as unknown as MissionsServicePrivate;
      await expect(
        privateSvc.assertNoOverlap('d1', new Date(), new Date()),
      ).rejects.toThrow();
      expect(
        notificationsService.notifyScheduleConflictIfEnabled,
      ).not.toHaveBeenCalled();
    });

    it('handles audit service failure silently', async () => {
      const drone = { id: 'd1', status: DroneStatus.AVAILABLE } as Drone;
      const mission = {
        id: 'm1',
        droneId: 'd1',
        status: MissionStatus.PLANNED,
      } as Mission;
      const futureStart = new Date(Date.now() + 86400000).toISOString();
      const futureEnd = new Date(Date.now() + 90000000).toISOString();

      dronesRepository.findOne.mockResolvedValue(drone);
      missionsRepository.create.mockReturnValue(mission);
      missionsRepository.save.mockResolvedValue(mission);
      auditService.record.mockRejectedValue(new Error('Audit Failed'));

      const createDto: CreateMissionDto = {
        droneId: 'd1',
        plannedStart: futureStart,
        plannedEnd: futureEnd,
        name: 'Test',
        type: MissionType.WIND_TURBINE_INSPECTION,
        pilotName: 'Pilot',
        siteLocation: 'Site',
      };
      const result = await service.create(createDto, OWNER_ID, 'u1');
      expect(result).toBeDefined();
    });

    it('handles notification service failure silently', async () => {
      const mission = {
        id: 'm1',
        status: MissionStatus.IN_PROGRESS,
        droneId: 'd1',
      } as Mission;
      const drone = {
        id: 'd1',
        totalFlightHours: 10,
        serialNumber: 'SN1',
        status: DroneStatus.IN_MISSION,
      } as Drone;
      missionsRepository.findOne.mockResolvedValue(mission);
      dronesRepository.findOne.mockResolvedValue(drone);
      notificationsService.notifyMaintenanceDueStub.mockRejectedValue(
        new Error('Notification Failed'),
      );

      const result = await service.transition(
        'm1',
        { status: MissionStatus.COMPLETED, flightHoursLogged: 1 },
        OWNER_ID,
        'u1',
      );
      expect(result.status).toBe(MissionStatus.COMPLETED);
    });
  });
});

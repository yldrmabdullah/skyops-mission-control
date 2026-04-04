import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  Drone,
  DroneModel,
  DroneStatus,
} from '../drones/entities/drone.entity';
import { Mission, MissionStatus, MissionType } from './entities/mission.entity';
import { MissionsService } from './missions.service';

const OWNER_ID = '11111111-1111-4111-8111-111111111111';

function createMissionRepositoryMock() {
  const queryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
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
  let service: MissionsService;

  beforeEach(() => {
    missionsRepository = createMissionRepositoryMock();
    dronesRepository = createDroneRepositoryMock();
    const auditService = { record: jest.fn().mockResolvedValue(undefined) };
    const notificationsService = {
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
      auditService as never,
      notificationsService as never,
    );
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
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects mission creation when an overlapping mission exists', async () => {
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
    ).rejects.toThrow(BadRequestException);
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
    ).rejects.toThrow(BadRequestException);
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
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects whitespace-only abort reason', async () => {
    const mission = {
      id: 'mission-1',
      droneId: 'drone-1',
      status: MissionStatus.IN_PROGRESS,
      drone: { ownerId: OWNER_ID },
    } as Mission;

    missionsRepository.findOne.mockResolvedValue(mission);
    dronesRepository.findOne.mockResolvedValue({
      id: 'drone-1',
      ownerId: OWNER_ID,
      status: DroneStatus.IN_MISSION,
    } as Drone);

    await expect(
      service.transition(
        'mission-1',
        {
          status: MissionStatus.ABORTED,
          abortReason: '   ',
        },
        OWNER_ID,
        OWNER_ID,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('requires an abort reason when aborting a mission', async () => {
    const mission = {
      id: 'mission-1',
      droneId: 'drone-1',
      status: MissionStatus.IN_PROGRESS,
      drone: { ownerId: OWNER_ID },
    } as Mission;

    missionsRepository.findOne.mockResolvedValue(mission);
    dronesRepository.findOne.mockResolvedValue({
      id: 'drone-1',
      ownerId: OWNER_ID,
      status: DroneStatus.IN_MISSION,
    } as Drone);

    await expect(
      service.transition(
        'mission-1',
        {
          status: MissionStatus.ABORTED,
        },
        OWNER_ID,
        OWNER_ID,
      ),
    ).rejects.toThrow(BadRequestException);
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
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects planned mission reassignment when the next drone is unavailable', async () => {
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
    ).rejects.toThrow(BadRequestException);
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
    ).rejects.toThrow(NotFoundException);
  });

  it('completes a mission and updates drone hours', async () => {
    const mission = {
      id: 'mission-1',
      droneId: 'drone-1',
      status: MissionStatus.IN_PROGRESS,
      drone: { ownerId: OWNER_ID },
    } as Mission;
    const drone = {
      id: 'drone-1',
      ownerId: OWNER_ID,
      model: DroneModel.MATRICE_300,
      status: DroneStatus.IN_MISSION,
      totalFlightHours: 49,
      flightHoursAtLastMaintenance: 0,
      lastMaintenanceDate: new Date('2026-01-01T00:00:00.000Z'),
      nextMaintenanceDueDate: new Date('2026-12-01T00:00:00.000Z'),
    } as Drone;

    missionsRepository.findOne.mockResolvedValue(mission);
    dronesRepository.findOne.mockResolvedValue(drone);

    const updatedMission = await service.transition(
      'mission-1',
      {
        status: MissionStatus.COMPLETED,
        flightHoursLogged: 2,
      },
      OWNER_ID,
      OWNER_ID,
    );

    expect(updatedMission.status).toBe(MissionStatus.COMPLETED);
    expect(drone.totalFlightHours).toBe(51);
    expect(drone.status).toBe(DroneStatus.MAINTENANCE);
  });

  it('allows updating non-date fields even if the planned date is in the past', async () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
    const mission = {
      id: 'mission-1',
      droneId: 'drone-1',
      status: MissionStatus.PLANNED,
      plannedStart: pastDate,
      plannedEnd: new Date(pastDate.getTime() + 1000 * 60 * 60),
      drone: { ownerId: OWNER_ID },
    } as Mission;

    missionsRepository.findOne.mockResolvedValue(mission);
    missionsRepository.__queryBuilder.getOne.mockResolvedValue(null);

    const updated = await service.update(
      'mission-1',
      { name: 'Updated name' },
      OWNER_ID,
    );

    expect(updated.name).toBe('Updated name');
    expect(missionsRepository.save).toHaveBeenCalled();
  });

  it('rejects updating planned date to a past date', async () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60);
    const pastDate = new Date(Date.now() - 1000 * 60 * 60);
    const mission = {
      id: 'mission-1',
      droneId: 'drone-1',
      status: MissionStatus.PLANNED,
      plannedStart: futureDate,
      plannedEnd: new Date(futureDate.getTime() + 1000 * 60 * 60),
      drone: { ownerId: OWNER_ID },
    } as Mission;

    missionsRepository.findOne.mockResolvedValue(mission);

    await expect(
      service.update(
        'mission-1',
        { plannedStart: pastDate.toISOString() },
        OWNER_ID,
      ),
    ).rejects.toThrow(BadRequestException);
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
    ).rejects.toThrow(BadRequestException);
  });
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
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
    service = new MissionsService(
      missionsRepository as unknown as Repository<Mission>,
      dronesRepository as unknown as Repository<Drone>,
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
    );

    expect(updatedMission.status).toBe(MissionStatus.COMPLETED);
    expect(drone.totalFlightHours).toBe(51);
    expect(drone.status).toBe(DroneStatus.MAINTENANCE);
  });
});

import type { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { CreateMissionUseCase } from './create-mission.use-case';
import { WorkspaceContext } from '../../common/workspace-context/workspace-context';
import { NotificationsService } from '../../notifications/notifications.service';
import { Drone, DroneStatus } from '../../drones/entities/drone.entity';
import { Mission } from '../entities/mission.entity';
import { MissionType } from '../entities/mission.entity';
import {
  DroneNotFoundException,
  DroneUnavailableForNewMissionException,
  MissionScheduleOverlapException,
} from '../exceptions/mission-specific.exceptions';

describe('CreateMissionUseCase', () => {
  const fleetOwnerId = 'owner-1';
  const workspaceContext = {
    fleetOwnerId,
    userId: 'user-1',
  } as WorkspaceContext;

  const notificationsService = {
    notifyScheduleConflictIfEnabled: jest.fn().mockResolvedValue(undefined),
  } as unknown as NotificationsService;

  const baseDto = {
    name: 'Mission',
    type: MissionType.WIND_TURBINE_INSPECTION,
    droneId: 'drone-1',
    pilotName: 'Pilot',
    siteLocation: 'Site',
    plannedStart: '2030-02-01T10:00:00.000Z',
    plannedEnd: '2030-02-01T12:00:00.000Z',
  };

  let manager: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let dataSource: Pick<DataSource, 'transaction'>;

  beforeEach(() => {
    manager = {
      findOne: jest.fn(),
      create: jest.fn((_entity: unknown, partial: object) => ({
        ...partial,
        id: 'new-mission',
      })),
      save: jest.fn((m: object) => Promise.resolve(m)),
    };
    dataSource = {
      transaction: jest.fn((cb: (m: typeof manager) => Promise<unknown>) =>
        cb(manager),
      ),
    };
  });

  function buildUseCase() {
    return new CreateMissionUseCase(
      dataSource as DataSource,
      workspaceContext,
      notificationsService,
    );
  }

  it('throws DroneNotFoundException when drone is missing', async () => {
    manager.findOne.mockResolvedValue(null);
    const useCase = buildUseCase();
    await expect(useCase.execute(baseDto)).rejects.toThrow(
      DroneNotFoundException,
    );
  });

  it('throws DroneUnavailableForNewMissionException when drone is not AVAILABLE', async () => {
    manager.findOne.mockImplementation(
      (entity: EntityTarget<ObjectLiteral>) => {
        if (entity === Drone) {
          return Promise.resolve({
            id: 'drone-1',
            ownerId: fleetOwnerId,
            status: DroneStatus.IN_MISSION,
          });
        }
        return Promise.resolve(null);
      },
    );
    const useCase = buildUseCase();
    await expect(useCase.execute(baseDto)).rejects.toThrow(
      DroneUnavailableForNewMissionException,
    );
  });

  it('throws MissionScheduleOverlapException when an active mission overlaps the window', async () => {
    manager.findOne.mockImplementation(
      (entity: EntityTarget<ObjectLiteral>) => {
        if (entity === Drone) {
          return Promise.resolve({
            id: 'drone-1',
            ownerId: fleetOwnerId,
            status: DroneStatus.AVAILABLE,
          });
        }
        if (entity === Mission) {
          return Promise.resolve({ id: 'existing' });
        }
        return Promise.resolve(null);
      },
    );
    const useCase = buildUseCase();
    await expect(useCase.execute(baseDto)).rejects.toThrow(
      MissionScheduleOverlapException,
    );
    expect(
      notificationsService.notifyScheduleConflictIfEnabled,
    ).toHaveBeenCalled();
  });

  it('persists a planned mission when valid', async () => {
    manager.findOne.mockImplementation(
      (entity: EntityTarget<ObjectLiteral>) => {
        if (entity === Drone) {
          return Promise.resolve({
            id: 'drone-1',
            ownerId: fleetOwnerId,
            status: DroneStatus.AVAILABLE,
          });
        }
        if (entity === Mission) {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      },
    );
    const useCase = buildUseCase();
    const result = await useCase.execute(baseDto);
    expect(result.id).toBe('new-mission');
    expect(manager.save).toHaveBeenCalled();
  });
});

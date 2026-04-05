import type { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { UpdateMissionUseCase } from './update-mission.use-case';
import { WorkspaceContext } from '../../common/workspace-context/workspace-context';
import { Drone, DroneStatus } from '../../drones/entities/drone.entity';
import {
  Mission,
  MissionStatus,
  MissionType,
} from '../entities/mission.entity';
import {
  MissionNotFoundException,
  MissionNotPlannedForUpdateException,
  MissionScheduleOverlapException,
  ReplacementDroneUnavailableException,
} from '../exceptions/mission-specific.exceptions';

describe('UpdateMissionUseCase', () => {
  const fleetOwnerId = 'owner-1';
  const workspaceContext = {
    fleetOwnerId,
    userId: 'user-1',
  } as WorkspaceContext;

  const plannedStart = new Date('2030-03-01T08:00:00.000Z');
  const plannedEnd = new Date('2030-03-01T10:00:00.000Z');

  let manager: { findOne: jest.Mock; save: jest.Mock };
  let dataSource: Pick<DataSource, 'transaction'>;

  beforeEach(() => {
    manager = {
      findOne: jest.fn(),
      save: jest.fn((m: Mission) => Promise.resolve(m)),
    };
    dataSource = {
      transaction: jest.fn((cb: (m: typeof manager) => Promise<unknown>) =>
        cb(manager),
      ),
    };
  });

  function buildUseCase() {
    return new UpdateMissionUseCase(dataSource as DataSource, workspaceContext);
  }

  function plannedMission(overrides: Partial<Mission> = {}): Mission {
    return {
      id: 'mission-1',
      droneId: 'drone-1',
      status: MissionStatus.PLANNED,
      plannedStart,
      plannedEnd,
      name: 'N',
      type: MissionType.WIND_TURBINE_INSPECTION,
      pilotName: 'P',
      siteLocation: 'S',
      drone: { ownerId: fleetOwnerId } as Drone,
      ...overrides,
    } as Mission;
  }

  it('throws MissionNotFoundException when mission is missing', async () => {
    manager.findOne.mockResolvedValue(null);
    const useCase = buildUseCase();
    await expect(useCase.execute('mission-1', { name: 'X' })).rejects.toThrow(
      MissionNotFoundException,
    );
  });

  it('throws MissionNotPlannedForUpdateException when mission is not PLANNED', async () => {
    manager.findOne.mockResolvedValue(
      plannedMission({ status: MissionStatus.IN_PROGRESS }),
    );
    const useCase = buildUseCase();
    await expect(useCase.execute('mission-1', { name: 'X' })).rejects.toThrow(
      MissionNotPlannedForUpdateException,
    );
  });

  it('throws ReplacementDroneUnavailableException when new drone is not AVAILABLE', async () => {
    manager.findOne.mockImplementation(
      (
        entity: EntityTarget<ObjectLiteral>,
        opts: { where?: { id?: string } },
      ) => {
        if (entity === Mission) {
          return Promise.resolve(plannedMission());
        }
        if (entity === Drone && opts?.where?.id === 'drone-2') {
          return Promise.resolve({
            id: 'drone-2',
            ownerId: fleetOwnerId,
            status: DroneStatus.MAINTENANCE,
          });
        }
        return Promise.resolve(null);
      },
    );
    const useCase = buildUseCase();
    await expect(
      useCase.execute('mission-1', { droneId: 'drone-2' }),
    ).rejects.toThrow(ReplacementDroneUnavailableException);
  });

  it('throws MissionScheduleOverlapException when rescheduling overlaps another active mission', async () => {
    const mission = plannedMission();
    const calls: string[] = [];
    manager.findOne.mockImplementation(
      (entity: EntityTarget<ObjectLiteral>) => {
        if (entity === Mission) {
          calls.push('mission');
          if (calls.filter((c) => c === 'mission').length === 1) {
            return Promise.resolve(mission);
          }
          return Promise.resolve({ id: 'overlap' });
        }
        if (entity === Drone) {
          return Promise.resolve({
            id: 'drone-1',
            ownerId: fleetOwnerId,
            status: DroneStatus.AVAILABLE,
          });
        }
        return Promise.resolve(null);
      },
    );

    const useCase = buildUseCase();
    await expect(
      useCase.execute('mission-1', {
        plannedStart: '2030-04-01T08:00:00.000Z',
        plannedEnd: '2030-04-01T10:00:00.000Z',
      }),
    ).rejects.toThrow(MissionScheduleOverlapException);
  });
});

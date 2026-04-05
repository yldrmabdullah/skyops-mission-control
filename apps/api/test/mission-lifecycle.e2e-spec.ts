import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { DataType, newDb } from 'pg-mem';
import { User } from '../src/auth/entities/user.entity';
import {
  Drone,
  DroneModel,
  DroneStatus,
} from '../src/drones/entities/drone.entity';
import { DronesService } from '../src/drones/drones.service';
import { MaintenanceLog } from '../src/maintenance/entities/maintenance-log.entity';
import {
  Mission,
  MissionStatus,
  MissionType,
} from '../src/missions/entities/mission.entity';
import { CreateMissionUseCase } from '../src/missions/use-cases/create-mission.use-case';
import { TransitionMissionUseCase } from '../src/missions/use-cases/transition-mission.use-case';
import { TypeOrmMissionsRepository } from '../src/missions/repositories/typeorm-missions.repository';
import { TypeOrmDronesRepository } from '../src/drones/repositories/typeorm-drones.repository';
import { TypeOrmMaintenanceLogsRepository } from '../src/maintenance/repositories/typeorm-maintenance-logs.repository';
import { WorkspaceContext } from '../src/common/workspace-context/workspace-context';

describe('Mission lifecycle integration', () => {
  let dataSource: DataSource;
  let dronesService: DronesService;
  let createMissionUseCase: CreateMissionUseCase;
  let transitionMissionUseCase: TransitionMissionUseCase;
  let workspaceContext: WorkspaceContext;
  let ownerId: string;

  beforeEach(async () => {
    const database = newDb({
      autoCreateForeignKeyIndices: true,
    });

    database.public.registerFunction({
      name: 'version',
      returns: DataType.text,
      implementation: () => '14.0',
    });
    database.public.registerFunction({
      name: 'current_database',
      returns: DataType.text,
      implementation: () => 'skyops_test',
    });
    database.public.registerFunction({
      name: 'uuid_generate_v4',
      returns: DataType.uuid,
      implementation: () => randomUUID(),
      impure: true,
    });

    dataSource = (await database.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [User, Drone, Mission, MaintenanceLog],
      synchronize: true,
    })) as DataSource;

    await dataSource.initialize();

    const userRepository = dataSource.getRepository(User);
    const missionRepository = dataSource.getRepository(Mission);
    const droneRepository = dataSource.getRepository(Drone);
    const maintenanceLogRepository = dataSource.getRepository(MaintenanceLog);

    const owner = await userRepository.save(
      userRepository.create({
        email: 'integration@test.local',
        passwordHash: 'x',
        fullName: 'Integration',
      }),
    );
    ownerId = owner.id;

    workspaceContext = {
      fleetOwnerId: ownerId,
      userId: ownerId,
    } as WorkspaceContext;

    const auditService = { record: jest.fn().mockResolvedValue(undefined) } as any;
    const notificationsService = {
      notifyScheduleConflictIfEnabled: jest.fn().mockResolvedValue(undefined),
      notifyMaintenanceDueStub: jest.fn().mockResolvedValue(undefined),
    } as any;

    const missionsRepo = new TypeOrmMissionsRepository(missionRepository);
    const dronesRepo = new TypeOrmDronesRepository(droneRepository);
    const maintRepo = new TypeOrmMaintenanceLogsRepository(maintenanceLogRepository);

    dronesService = new DronesService(
      dataSource,
      dronesRepo,
      missionsRepo,
      maintRepo,
      auditService,
      workspaceContext,
    );

    createMissionUseCase = new CreateMissionUseCase(
      missionsRepo,
      dronesRepo,
      auditService,
      notificationsService,
      workspaceContext,
    );

    transitionMissionUseCase = new TransitionMissionUseCase(
      dataSource,
      missionsRepo,
      dronesRepo,
      notificationsService,
      workspaceContext,
    );
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('creates a drone, schedules a mission, completes it, and updates maintenance state', async () => {
    const drone = await dronesService.create({
      serialNumber: 'SKY-A1B2-C3D4',
      model: DroneModel.MATRICE_300,
      totalFlightHours: 49,
      flightHoursAtLastMaintenance: 0,
      lastMaintenanceDate: '2026-03-01T00:00:00.000Z',
    });

    const mission = await createMissionUseCase.execute({
      name: 'Turbine inspection alpha',
      type: MissionType.WIND_TURBINE_INSPECTION,
      droneId: drone.id,
      pilotName: 'Amelia Stone',
      siteLocation: 'Hamburg, Germany',
      plannedStart: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      plannedEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    });

    await transitionMissionUseCase.execute(mission.id, {
      status: MissionStatus.PRE_FLIGHT_CHECK,
    });
    await transitionMissionUseCase.execute(mission.id, {
      status: MissionStatus.IN_PROGRESS,
    });
    const completedMission = await transitionMissionUseCase.execute(mission.id, {
      status: MissionStatus.COMPLETED,
      flightHoursLogged: 2,
    });

    const updatedDrone = await dataSource.getRepository(Drone).findOneByOrFail({
      id: drone.id,
    });

    expect(completedMission.status).toBe(MissionStatus.COMPLETED);
    expect(updatedDrone.totalFlightHours).toBe(51);
    expect(updatedDrone.status).toBe(DroneStatus.MAINTENANCE);
  });
});

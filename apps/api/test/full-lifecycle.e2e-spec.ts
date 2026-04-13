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
import {
  MaintenanceLog,
  MaintenanceType,
} from '../src/maintenance/entities/maintenance-log.entity';
import {
  Mission,
  MissionStatus,
  MissionType,
} from '../src/missions/entities/mission.entity';
import { AuditService } from '../src/audit/audit.service';
import { CreateMissionUseCase } from '../src/missions/use-cases/create-mission.use-case';
import { TransitionMissionUseCase } from '../src/missions/use-cases/transition-mission.use-case';
import { NotificationsService } from '../src/notifications/notifications.service';
import { TypeOrmMissionsRepository } from '../src/missions/repositories/typeorm-missions.repository';
import { TypeOrmDronesRepository } from '../src/drones/repositories/typeorm-drones.repository';
import { TypeOrmMaintenanceLogsRepository } from '../src/maintenance/repositories/typeorm-maintenance-logs.repository';
import { WorkspaceContext } from '../src/common/workspace-context/workspace-context';
import { MaintenanceService } from '../src/maintenance/maintenance.service';

describe('Full lifecycle integration (Exercise 10)', () => {
  let dataSource: DataSource;
  let dronesService: DronesService;
  let createMissionUseCase: CreateMissionUseCase;
  let transitionMissionUseCase: TransitionMissionUseCase;
  let maintenanceService: MaintenanceService;
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

    const auditService = {
      record: jest.fn().mockResolvedValue(undefined),
    } as unknown as AuditService;
    const notificationsService = {
      notifyScheduleConflictIfEnabled: jest.fn().mockResolvedValue(undefined),
      notifyMaintenanceDueStub: jest.fn().mockResolvedValue(undefined),
    } as unknown as NotificationsService;

    const missionsRepo = new TypeOrmMissionsRepository(missionRepository);
    const dronesRepo = new TypeOrmDronesRepository(droneRepository);
    const maintRepo = new TypeOrmMaintenanceLogsRepository(
      maintenanceLogRepository,
    );

    dronesService = new DronesService(
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

    maintenanceService = new MaintenanceService(
      dataSource,
      maintRepo,
      dronesRepo,
      workspaceContext,
    );
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('runs full lifecycle: create drone -> mission complete -> maintenance log -> available', async () => {
    // a. Drone oluştur (49 saat, flightHoursAtLastMaintenance: 0)
    const drone = await dronesService.create({
      serialNumber: 'SKY-TEST-A1B1',
      model: DroneModel.MATRICE_300,
      totalFlightHours: 49,
      flightHoursAtLastMaintenance: 0,
      lastMaintenanceDate: new Date('2026-03-01T00:00:00.000Z').toISOString(),
    });

    // b. Mission oluştur
    const mission = await createMissionUseCase.execute({
      name: 'Full lifecycle inspection',
      type: MissionType.WIND_TURBINE_INSPECTION,
      droneId: drone.id,
      pilotName: 'Amelia Stone',
      siteLocation: 'Hamburg, Germany',
      plannedStart: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      plannedEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    });

    // c. Transition: PLANNED → PRE_FLIGHT → IN_PROGRESS → COMPLETED (+2h)
    await transitionMissionUseCase.execute(mission.id, {
      status: MissionStatus.PRE_FLIGHT_CHECK,
    });
    await transitionMissionUseCase.execute(mission.id, {
      status: MissionStatus.IN_PROGRESS,
    });
    await transitionMissionUseCase.execute(mission.id, {
      status: MissionStatus.COMPLETED,
      flightHoursLogged: 2,
    });

    // d. Assert: drone.totalFlightHours === 51, drone.status === MAINTENANCE
    const afterMissionDrone = await dataSource
      .getRepository(Drone)
      .findOneByOrFail({ id: drone.id });

    expect(afterMissionDrone.totalFlightHours).toBe(51);
    expect(afterMissionDrone.status).toBe(DroneStatus.MAINTENANCE);

    // e. Maintenance log oluştur (flightHoursAtMaintenance: 51)
    const logPerformedAt = new Date().toISOString();
    await maintenanceService.create({
      droneId: drone.id,
      type: MaintenanceType.ROUTINE_CHECK,
      technicianName: 'Bob the Builder',
      notes: 'All checks passed',
      performedAt: logPerformedAt,
      flightHoursAtMaintenance: 51,
    });

    // Assert f, g, h
    const finalDrone = await dataSource
      .getRepository(Drone)
      .findOneByOrFail({ id: drone.id });

    expect(finalDrone.status).toBe(DroneStatus.AVAILABLE);
    expect(finalDrone.flightHoursAtLastMaintenance).toBe(51);
    expect(finalDrone.lastMaintenanceDate.toISOString()).toBe(
      new Date(logPerformedAt).toISOString(),
    );
  });
});

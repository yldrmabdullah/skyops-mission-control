import { randomUUID } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import { DataType, newDb } from 'pg-mem';
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
import { MissionsService } from '../src/missions/missions.service';

describe('Mission lifecycle integration', () => {
  let dataSource: DataSource;
  let dronesService: DronesService;
  let missionsService: MissionsService;
  let droneRepository: Repository<Drone>;
  let missionRepository: Repository<Mission>;
  let maintenanceLogRepository: Repository<MaintenanceLog>;

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

    dataSource = database.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [Drone, Mission, MaintenanceLog],
      synchronize: true,
    }) as DataSource;

    await dataSource.initialize();

    droneRepository = dataSource.getRepository(Drone);
    missionRepository = dataSource.getRepository(Mission);
    maintenanceLogRepository = dataSource.getRepository(MaintenanceLog);

    dronesService = new DronesService(
      droneRepository,
      missionRepository,
      maintenanceLogRepository,
    );
    missionsService = new MissionsService(missionRepository, droneRepository);
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

    const mission = await missionsService.create({
      name: 'Turbine inspection alpha',
      type: MissionType.WIND_TURBINE_INSPECTION,
      droneId: drone.id,
      pilotName: 'Amelia Stone',
      siteLocation: 'Hamburg, Germany',
      plannedStart: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      plannedEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    });

    await missionsService.transition(mission.id, {
      status: MissionStatus.PRE_FLIGHT_CHECK,
    });
    await missionsService.transition(mission.id, {
      status: MissionStatus.IN_PROGRESS,
    });
    const completedMission = await missionsService.transition(mission.id, {
      status: MissionStatus.COMPLETED,
      flightHoursLogged: 2,
    });

    const updatedDrone = await droneRepository.findOneByOrFail({
      id: drone.id,
    });

    expect(completedMission.status).toBe(MissionStatus.COMPLETED);
    expect(updatedDrone.totalFlightHours).toBe(51);
    expect(updatedDrone.status).toBe(DroneStatus.MAINTENANCE);
  });
});

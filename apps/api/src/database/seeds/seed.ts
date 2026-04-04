import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import dataSource from '../data-source';
import { User } from '../../auth/entities/user.entity';
import {
  Drone,
  DroneModel,
  DroneStatus,
} from '../../drones/entities/drone.entity';
import { calculateNextMaintenanceDueDate } from '../../drones/utils/maintenance.utils';
import {
  MaintenanceLog,
  MaintenanceType,
} from '../../maintenance/entities/maintenance-log.entity';
import {
  Mission,
  MissionStatus,
  MissionType,
} from '../../missions/entities/mission.entity';

const droneModels = Object.values(DroneModel);
const missionTypes = Object.values(MissionType);
const maintenanceTypes = Object.values(MaintenanceType);

function createSerialNumber() {
  return `SKY-${faker.string.alphanumeric({ length: 4, casing: 'upper' })}-${faker.string.alphanumeric({ length: 4, casing: 'upper' })}`;
}

async function seed() {
  await dataSource.initialize();

  const droneRepository = dataSource.getRepository(Drone);
  const missionRepository = dataSource.getRepository(Mission);
  const maintenanceRepository = dataSource.getRepository(MaintenanceLog);
  const userRepository = dataSource.getRepository(User);

  await maintenanceRepository.clear();
  await missionRepository.clear();
  await droneRepository.clear();

  const demoEmail = 'ops@skyops.demo';
  let demoUser = await userRepository.findOne({ where: { email: demoEmail } });

  if (!demoUser) {
    demoUser = await userRepository.save(
      userRepository.create({
        email: demoEmail,
        passwordHash: await bcrypt.hash('SkyOpsDemo1', 12),
        fullName: 'Demo Operations',
      }),
    );
    console.info(`Demo sign-in: ${demoEmail} / SkyOpsDemo1`);
  }

  const drones = await droneRepository.save(
    Array.from({ length: 20 }, () => {
      const totalFlightHours = faker.number.float({
        min: 5,
        max: 180,
        fractionDigits: 1,
      });
      const hoursSinceMaintenance = faker.number.float({
        min: 0,
        max: 48,
        fractionDigits: 1,
      });
      const flightHoursAtLastMaintenance = Number(
        Math.max(0, totalFlightHours - hoursSinceMaintenance).toFixed(1),
      );
      const lastMaintenanceDate = faker.date.recent({ days: 75 });

      return droneRepository.create({
        ownerId: demoUser.id,
        serialNumber: createSerialNumber(),
        model: faker.helpers.arrayElement(droneModels),
        status: DroneStatus.AVAILABLE,
        totalFlightHours,
        flightHoursAtLastMaintenance,
        lastMaintenanceDate,
        nextMaintenanceDueDate: calculateNextMaintenanceDueDate(
          lastMaintenanceDate,
          totalFlightHours,
          flightHoursAtLastMaintenance,
        ),
      });
    }),
  );

  const missions: Mission[] = [];

  for (let index = 0; index < 50; index += 1) {
    const drone = faker.helpers.arrayElement(drones);
    const status = faker.helpers.arrayElement([
      MissionStatus.PLANNED,
      MissionStatus.PRE_FLIGHT_CHECK,
      MissionStatus.IN_PROGRESS,
      MissionStatus.COMPLETED,
      MissionStatus.ABORTED,
    ]);
    const startOffsetDays =
      status === MissionStatus.PLANNED ||
      status === MissionStatus.PRE_FLIGHT_CHECK
        ? faker.number.int({ min: 1, max: 14 })
        : faker.number.int({ min: -20, max: -1 });

    const plannedStart = faker.date.soon({
      days: Math.abs(startOffsetDays),
      refDate:
        startOffsetDays >= 0
          ? new Date()
          : new Date(Date.now() + startOffsetDays * 24 * 60 * 60 * 1000),
    });
    const plannedEnd = new Date(plannedStart);
    plannedEnd.setUTCHours(
      plannedEnd.getUTCHours() + faker.number.int({ min: 1, max: 4 }),
    );

    const mission = missionRepository.create({
      name: `${faker.company.name()} ${faker.helpers.arrayElement(['Inspection', 'Survey', 'Patrol'])}`,
      type: faker.helpers.arrayElement(missionTypes),
      droneId: drone.id,
      pilotName: faker.person.fullName(),
      siteLocation: `${faker.location.city()}, ${faker.location.country()}`,
      plannedStart,
      plannedEnd,
      status,
      actualStart:
        status === MissionStatus.IN_PROGRESS ||
        status === MissionStatus.COMPLETED ||
        status === MissionStatus.ABORTED
          ? plannedStart
          : null,
      actualEnd:
        status === MissionStatus.COMPLETED || status === MissionStatus.ABORTED
          ? plannedEnd
          : null,
      flightHoursLogged:
        status === MissionStatus.COMPLETED
          ? faker.number.float({ min: 0.8, max: 5, fractionDigits: 1 })
          : null,
      abortReason:
        status === MissionStatus.ABORTED
          ? faker.helpers.arrayElement([
              'Unexpected wind conditions.',
              'Battery health warning detected.',
              'Flight zone restriction triggered.',
            ])
          : null,
    });

    missions.push(mission);
  }

  await missionRepository.save(missions);

  const maintenanceLogs = await maintenanceRepository.save(
    Array.from({ length: 30 }, () => {
      const drone = faker.helpers.arrayElement(drones);
      const performedAt = faker.date.recent({ days: 120 });

      return maintenanceRepository.create({
        droneId: drone.id,
        type: faker.helpers.arrayElement(maintenanceTypes),
        technicianName: faker.person.fullName(),
        notes:
          faker.helpers.maybe(() => faker.lorem.sentence(), {
            probability: 0.6,
          }) ?? null,
        performedAt,
        flightHoursAtMaintenance: Number(
          faker.number
            .float({
              min: Math.max(0, drone.totalFlightHours - 2),
              max: drone.totalFlightHours,
              fractionDigits: 1,
            })
            .toFixed(1),
        ),
      });
    }),
  );

  console.info(
    `Seed complete: ${drones.length} drones, ${missions.length} missions, ${maintenanceLogs.length} maintenance logs.`,
  );

  await dataSource.destroy();
}

void seed();

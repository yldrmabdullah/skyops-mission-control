import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import dataSource from '../data-source';
import { AuditEvent } from '../../audit/entities/audit-event.entity';
import { User } from '../../auth/entities/user.entity';
import { defaultNotificationPreferences } from '../../auth/notification-preferences.types';
import { OperatorRole } from '../../auth/operator-role.enum';
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
import { InAppNotification } from '../../notifications/entities/in-app-notification.entity';

const droneModels = Object.values(DroneModel);
const missionTypes = Object.values(MissionType);
const maintenanceTypes = Object.values(MaintenanceType);

const DEMO_PASSWORD = 'SkyOpsDemo1';
const DEMO_MANAGER_EMAIL = 'ops@skyops.demo';
const DEMO_PILOT_EMAIL = 'pilot@skyops.demo';
const DEMO_TECH_EMAIL = 'tech@skyops.demo';

function createSerialNumber() {
  return `SKY-${faker.string.alphanumeric({ length: 4, casing: 'upper' })}-${faker.string.alphanumeric({ length: 4, casing: 'upper' })}`;
}

function droneStatusForIndex(index: number): DroneStatus {
  if (index < 3) {
    return DroneStatus.IN_MISSION;
  }
  if (index < 8) {
    return DroneStatus.MAINTENANCE;
  }
  if (index < 10) {
    return DroneStatus.RETIRED;
  }
  return DroneStatus.AVAILABLE;
}

export async function runSeed() {
  await dataSource.initialize();

  const droneRepository = dataSource.getRepository(Drone);
  const missionRepository = dataSource.getRepository(Mission);
  const maintenanceRepository = dataSource.getRepository(MaintenanceLog);
  const userRepository = dataSource.getRepository(User);
  const notificationRepository = dataSource.getRepository(InAppNotification);
  const auditRepository = dataSource.getRepository(AuditEvent);

  await notificationRepository
    .createQueryBuilder()
    .delete()
    .from(InAppNotification)
    .execute();
  await auditRepository
    .createQueryBuilder()
    .delete()
    .from(AuditEvent)
    .execute();
  /** One statement: Postgres rejects truncating `drones` while child tables still reference it. */
  await dataSource.query(
    'TRUNCATE TABLE maintenance_logs, missions, drones RESTART IDENTITY CASCADE',
  );

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  let demoUser = await userRepository.findOne({
    where: { email: DEMO_MANAGER_EMAIL },
  });

  const managerPrefs = {
    ...defaultNotificationPreferences,
    emailOnMaintenanceDue: true,
    inAppOnScheduleConflict: true,
  };

  if (!demoUser) {
    demoUser = await userRepository.save(
      userRepository.create({
        email: DEMO_MANAGER_EMAIL,
        passwordHash,
        fullName: 'Demo Operations',
        role: OperatorRole.MANAGER,
        workspaceOwnerId: null,
        mustChangePassword: false,
        notificationPreferences: managerPrefs,
      }),
    );
  } else {
    demoUser.passwordHash = passwordHash;
    demoUser.fullName = 'Demo Operations';
    demoUser.role = OperatorRole.MANAGER;
    demoUser.workspaceOwnerId = null;
    demoUser.mustChangePassword = false;
    demoUser.notificationPreferences = managerPrefs;
    await userRepository.save(demoUser);
  }

  let pilotUser = await userRepository.findOne({
    where: { email: DEMO_PILOT_EMAIL },
  });
  if (!pilotUser) {
    pilotUser = await userRepository.save(
      userRepository.create({
        email: DEMO_PILOT_EMAIL,
        passwordHash,
        fullName: 'Demo Pilot',
        role: OperatorRole.PILOT,
        workspaceOwnerId: demoUser.id,
        mustChangePassword: true,
        notificationPreferences: { ...defaultNotificationPreferences },
      }),
    );
  } else {
    pilotUser.passwordHash = passwordHash;
    pilotUser.fullName = 'Demo Pilot';
    pilotUser.role = OperatorRole.PILOT;
    pilotUser.workspaceOwnerId = demoUser.id;
    pilotUser.mustChangePassword = true;
    await userRepository.save(pilotUser);
  }

  let techUser = await userRepository.findOne({
    where: { email: DEMO_TECH_EMAIL },
  });
  if (!techUser) {
    techUser = await userRepository.save(
      userRepository.create({
        email: DEMO_TECH_EMAIL,
        passwordHash,
        fullName: 'Demo Technician',
        role: OperatorRole.TECHNICIAN,
        workspaceOwnerId: demoUser.id,
        mustChangePassword: false,
        notificationPreferences: { ...defaultNotificationPreferences },
      }),
    );
  } else {
    techUser.passwordHash = passwordHash;
    techUser.fullName = 'Demo Technician';
    techUser.role = OperatorRole.TECHNICIAN;
    techUser.workspaceOwnerId = demoUser.id;
    techUser.mustChangePassword = false;
    await userRepository.save(techUser);
  }

  const drones: Drone[] = [];

  for (let index = 0; index < 20; index += 1) {
    const status = droneStatusForIndex(index);
    const totalFlightHours = faker.number.float({
      min: 5,
      max: 180,
      fractionDigits: 1,
    });
    let hoursSinceMaintenance = faker.number.float({
      min: 0,
      max: 48,
      fractionDigits: 1,
    });
    if (status === DroneStatus.MAINTENANCE && index < 6) {
      hoursSinceMaintenance = faker.number.float({
        min: 52,
        max: 95,
        fractionDigits: 1,
      });
    }
    const flightHoursAtLastMaintenance = Number(
      Math.max(0, totalFlightHours - hoursSinceMaintenance).toFixed(1),
    );
    let lastMaintenanceDate = faker.date.recent({ days: 75 });
    if (status === DroneStatus.MAINTENANCE && index < 6) {
      lastMaintenanceDate = faker.date.recent({ days: 100 });
    }

    const nextMaintenanceDueDate = calculateNextMaintenanceDueDate(
      lastMaintenanceDate,
      totalFlightHours,
      flightHoursAtLastMaintenance,
    );

    drones.push(
      droneRepository.create({
        ownerId: demoUser.id,
        serialNumber: createSerialNumber(),
        model: faker.helpers.arrayElement(droneModels),
        status,
        totalFlightHours,
        flightHoursAtLastMaintenance,
        lastMaintenanceDate,
        nextMaintenanceDueDate,
      }),
    );
  }

  const savedDrones = await droneRepository.save(drones);

  const missions: Mission[] = [];
  const inMissionDrones = savedDrones.filter(
    (d) => d.status === DroneStatus.IN_MISSION,
  );
  const availableDrones = savedDrones.filter(
    (d) => d.status === DroneStatus.AVAILABLE,
  );
  const now = new Date();

  for (let i = 0; i < inMissionDrones.length; i += 1) {
    const drone = inMissionDrones[i];
    const plannedStart = new Date(now.getTime() - (2 + i) * 60 * 60 * 1000);
    const plannedEnd = new Date(now.getTime() + (3 - i) * 60 * 60 * 1000);
    missions.push(
      missionRepository.create({
        name: `Live patrol ${i + 1} — ${faker.location.city()}`,
        type: MissionType.POWER_LINE_PATROL,
        droneId: drone.id,
        pilotName: pilotUser.fullName,
        siteLocation: `${faker.location.city()}, ${faker.location.country()}`,
        plannedStart,
        plannedEnd,
        status: MissionStatus.IN_PROGRESS,
        actualStart: plannedStart,
        actualEnd: null,
        flightHoursLogged: null,
        abortReason: null,
      }),
    );
  }

  const bulkStatuses: MissionStatus[] = [
    MissionStatus.PLANNED,
    MissionStatus.PRE_FLIGHT_CHECK,
    MissionStatus.COMPLETED,
    MissionStatus.ABORTED,
  ];

  for (let index = 0; index < 47; index += 1) {
    const status = faker.helpers.arrayElement(bulkStatuses);
    const dronePool =
      status === MissionStatus.PLANNED ||
      status === MissionStatus.PRE_FLIGHT_CHECK
        ? availableDrones.length > 0
          ? availableDrones
          : savedDrones
        : savedDrones;
    const drone = faker.helpers.arrayElement(dronePool);

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

    missions.push(
      missionRepository.create({
        name: `${faker.company.name()} ${faker.helpers.arrayElement(['Inspection', 'Survey', 'Patrol'])}`,
        type: faker.helpers.arrayElement(missionTypes),
        droneId: drone.id,
        pilotName: faker.person.fullName(),
        siteLocation: `${faker.location.city()}, ${faker.location.country()}`,
        plannedStart,
        plannedEnd,
        status,
        actualStart:
          status === MissionStatus.COMPLETED || status === MissionStatus.ABORTED
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
      }),
    );
  }

  const savedMissions = await missionRepository.save(missions);

  const maintenanceLogs = await maintenanceRepository.save(
    Array.from({ length: 30 }, () => {
      const drone = faker.helpers.arrayElement(savedDrones);
      const performedAt = faker.date.recent({ days: 120 });

      return maintenanceRepository.create({
        droneId: drone.id,
        type: faker.helpers.arrayElement(maintenanceTypes),
        technicianName: techUser.fullName,
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

  const sampleMission = savedMissions.find(
    (m) => m.status === MissionStatus.COMPLETED,
  );
  const sampleDrone = savedDrones[0];

  const notifRows = [
    notificationRepository.create({
      userId: demoUser.id,
      title: 'Schedule conflict avoided',
      body: 'Mission overlap was detected during planning; adjust one of the planned windows in Mission Control.',
      readAt: null,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    }),
    notificationRepository.create({
      userId: demoUser.id,
      title: 'Fleet maintenance window',
      body: 'Several units are approaching their 50 flight-hour or 90-day maintenance threshold. Review the Maintenance watchlist on the dashboard.',
      readAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
    }),
  ];
  await notificationRepository.save(notifRows);

  const auditRows = [
    auditRepository.create({
      actorUserId: demoUser.id,
      action: 'DRONE_CREATED',
      entityType: 'Drone',
      entityId: sampleDrone.id,
      metadata: { serialNumber: sampleDrone.serialNumber },
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    }),
    auditRepository.create({
      actorUserId: demoUser.id,
      action: 'MISSION_CREATED',
      entityType: 'Mission',
      entityId: (sampleMission ?? savedMissions[0]).id,
      metadata: { name: (sampleMission ?? savedMissions[0]).name },
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    }),
    auditRepository.create({
      actorUserId: demoUser.id,
      action: 'MAINTENANCE_CREATED',
      entityType: 'MaintenanceLog',
      entityId: maintenanceLogs[0].id,
      metadata: { type: maintenanceLogs[0].type },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    }),
  ];
  await auditRepository.save(auditRows);

  console.info('');
  console.info('── Demo workspace (password for all: SkyOpsDemo1) ──');
  console.info(`  Manager:      ${DEMO_MANAGER_EMAIL}`);
  console.info(
    `  Pilot:        ${DEMO_PILOT_EMAIL}  (must change password on first sign-in)`,
  );
  console.info(`  Technician:   ${DEMO_TECH_EMAIL}`);
  console.info(
    '  Fleet data, notifications, and audit trail are scoped to the Manager workspace.',
  );
  console.info('──');

  console.info(
    `Seed complete: ${savedDrones.length} drones, ${savedMissions.length} missions, ${maintenanceLogs.length} maintenance logs.`,
  );

  await dataSource.destroy();
}

const isDirectRun = typeof require !== 'undefined' && require.main === module;
if (isDirectRun) {
  runSeed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

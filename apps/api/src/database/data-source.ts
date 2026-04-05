import { config as loadEnvironment } from 'dotenv';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { AuditEvent } from '../audit/entities/audit-event.entity';
import { Drone } from '../drones/entities/drone.entity';
import { MaintenanceLog } from '../maintenance/entities/maintenance-log.entity';
import { Mission } from '../missions/entities/mission.entity';
import { InAppNotification } from '../notifications/entities/in-app-notification.entity';

loadEnvironment({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
});

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [
    User,
    Drone,
    Mission,
    MaintenanceLog,
    AuditEvent,
    InAppNotification,
  ],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
});

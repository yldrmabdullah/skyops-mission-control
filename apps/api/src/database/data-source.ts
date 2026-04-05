import { config as loadEnvironment } from 'dotenv';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { AuditEvent } from '../audit/entities/audit-event.entity';
import { Drone } from '../drones/entities/drone.entity';
import { MaintenanceLog } from '../maintenance/entities/maintenance-log.entity';
import { Mission } from '../missions/entities/mission.entity';
import { InAppNotification } from '../notifications/entities/in-app-notification.entity';
import { postgresSslForUrl } from './postgres-ssl';

loadEnvironment({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
});

const databaseUrl = process.env.DATABASE_URL?.trim();

const entities = [
  User,
  Drone,
  Mission,
  MaintenanceLog,
  AuditEvent,
  InAppNotification,
];

const migrations = [join(__dirname, 'migrations', '*.{ts,js}')];

export default new DataSource(
  databaseUrl
    ? {
        type: 'postgres',
        url: databaseUrl,
        ssl: postgresSslForUrl(databaseUrl),
        entities,
        migrations,
      }
    : {
        type: 'postgres',
        host: process.env.DATABASE_HOST,
        port: Number(process.env.DATABASE_PORT ?? 5432),
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        entities,
        migrations,
      },
);

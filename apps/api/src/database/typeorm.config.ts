import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';

export function buildTypeOrmOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const databaseUrl = configService.get<string>('DATABASE_URL');

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      autoLoadEntities: false,
      synchronize: false,
      migrationsRun: true,
      logging: false,
      entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
      migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    };
  }

  return {
    type: 'postgres',
    host: configService.getOrThrow<string>('DATABASE_HOST'),
    port: configService.getOrThrow<number>('DATABASE_PORT'),
    username: configService.getOrThrow<string>('DATABASE_USERNAME'),
    password: configService.getOrThrow<string>('DATABASE_PASSWORD'),
    database: configService.getOrThrow<string>('DATABASE_NAME'),
    autoLoadEntities: false,
    synchronize: false,
    migrationsRun: true,
    logging: false,
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  };
}

export const typeOrmModuleAsyncOptions: TypeOrmModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: buildTypeOrmOptions,
};

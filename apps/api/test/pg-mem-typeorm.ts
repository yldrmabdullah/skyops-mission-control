import { randomUUID } from 'node:crypto';
import type { DataSource, DataSourceOptions, EntityTarget } from 'typeorm';
import { DataType, newDb, type IMemoryDb } from 'pg-mem';

export function registerPgMemPostgresCompat(database: IMemoryDb): void {
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
}

/**
 * In-memory Postgres adapter for integration-style tests (same pattern as e2e API).
 */
export async function createInitializedPgMemDataSource(options: {
  entities: ReadonlyArray<EntityTarget<object>>;
  synchronize?: boolean;
}): Promise<DataSource> {
  const database = newDb({ autoCreateForeignKeyIndices: true });
  registerPgMemPostgresCompat(database);

  const dataSource = database.adapters.createTypeormDataSource({
    type: 'postgres',
    entities: options.entities,
    synchronize: options.synchronize ?? true,
    logging: false,
  } satisfies DataSourceOptions) as DataSource;

  await dataSource.initialize();
  return dataSource;
}

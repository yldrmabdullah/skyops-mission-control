import 'reflect-metadata';
import { User } from '../auth/entities/user.entity';
import dataSource from './data-source';
import { runSeed } from './seeds/seed';

/**
 * Docker / production-style startup: apply migrations, then optionally load demo data.
 *
 * - `DOCKER_SKIP_SEED=1` — never run seed (migrations only).
 * - `DOCKER_FORCE_SEED=1` — run seed even if users exist (destructive for operational tables; see seed script).
 */
async function bootstrapDatabase() {
  await dataSource.initialize();

  try {
    const executed = await dataSource.runMigrations();
    if (executed.length > 0) {
      console.info(`[docker-entry] Applied ${executed.length} migration(s).`);
    }

    const userCount = await dataSource.getRepository(User).count();

    const force =
      process.env.DOCKER_FORCE_SEED === 'true' ||
      process.env.DOCKER_FORCE_SEED === '1';
    const skip =
      process.env.DOCKER_SKIP_SEED === 'true' ||
      process.env.DOCKER_SKIP_SEED === '1';

    if (skip) {
      console.info(
        '[docker-entry] DOCKER_SKIP_SEED is set — skipping automatic demo seed.',
      );
      return;
    }

    if (userCount === 0 || force) {
      if (force && userCount > 0) {
        console.warn(
          '[docker-entry] DOCKER_FORCE_SEED: running demo seed while users already exist (seed clears fleet / notification / audit tables).',
        );
      } else {
        console.info(
          '[docker-entry] No users in database — running demo seed.',
        );
      }
      await dataSource.destroy();
      await runSeed();
      return;
    }

    console.info(
      `[docker-entry] Skipping seed (${userCount} user(s) in database). Set DOCKER_FORCE_SEED=1 to re-seed.`,
    );
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

bootstrapDatabase().catch((err) => {
  console.error('[docker-entry] Database bootstrap failed:', err);
  process.exit(1);
});

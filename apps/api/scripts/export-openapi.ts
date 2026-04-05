import 'reflect-metadata';

/**
 * Writes repo-root contracts/openapi.json for web `types:openapi`.
 * Requires a reachable Postgres (e.g. `docker compose up -d postgres`) and env
 * matching local Docker: DATABASE_HOST=127.0.0.1, etc., or DATABASE_URL.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

/** Repo root when `pnpm --filter @skyops/api openapi:export` runs (cwd = apps/api). */
const repoRoot = join(process.cwd(), '../..');

async function main() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });
  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('SkyOps Mission Control API')
      .setDescription(
        'Operational backend for drone mission and maintenance tracking.',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste the access token from POST /api/auth/login',
        },
        'access-token',
      )
      .build(),
  );

  const out = join(repoRoot, 'contracts/openapi.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

  await app.close();
  console.log(`Wrote ${out}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack : String(err));
  process.exitCode = 1;
});

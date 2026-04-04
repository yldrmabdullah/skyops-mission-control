import { ConflictException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { AuthService } from '../auth/auth.service';
import { E2eModule } from './e2e.module';

async function bootstrap() {
  const app = await NestFactory.create(E2eModule);

  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const authService = app.get(AuthService);

  try {
    await authService.register({
      email: 'e2e@skyops.test',
      password: 'E2eTestPass1',
      fullName: 'E2E Operator',
    });
  } catch (error) {
    if (!(error instanceof ConflictException)) {
      throw error;
    }
  }

  await app.listen(3000);
}

void bootstrap();

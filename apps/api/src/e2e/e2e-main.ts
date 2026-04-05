import * as bcrypt from 'bcrypt';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { User } from '../auth/entities/user.entity';
import { defaultNotificationPreferences } from '../auth/notification-preferences.types';
import { OperatorRole } from '../auth/operator-role.enum';
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

  const dataSource = app.get(DataSource);
  const userRepo = dataSource.getRepository(User);
  const e2eEmail = 'e2e@skyops.test';
  let e2eUser = await userRepo.findOne({ where: { email: e2eEmail } });

  if (!e2eUser) {
    e2eUser = await userRepo.save(
      userRepo.create({
        email: e2eEmail,
        passwordHash: await bcrypt.hash('E2eTestPass1', 12),
        fullName: 'E2E Operator',
        role: OperatorRole.MANAGER,
        workspaceOwnerId: null,
        mustChangePassword: false,
        notificationPreferences: { ...defaultNotificationPreferences },
      }),
    );
  } else {
    e2eUser.role = OperatorRole.MANAGER;
    e2eUser.workspaceOwnerId = null;
    e2eUser.mustChangePassword = false;
    await userRepo.save(e2eUser);
  }

  await app.listen(3000);
}

void bootstrap();

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { InAppNotification } from './entities/in-app-notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { INotificationsRepository } from './repositories/notifications.repository.interface';
import { TypeOrmNotificationsRepository } from './repositories/typeorm-notifications.repository';

@Module({
  imports: [TypeOrmModule.forFeature([InAppNotification, User])],
  controllers: [NotificationsController],
  providers: [
    {
      provide: INotificationsRepository,
      useClass: TypeOrmNotificationsRepository,
    },
    NotificationsService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}

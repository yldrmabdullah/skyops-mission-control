import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import {
  defaultNotificationPreferences,
  type NotificationPreferences,
} from '../auth/notification-preferences.types';
import { INotificationsRepository } from './repositories/notifications.repository.interface';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: INotificationsRepository,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private mergePrefs(
    stored: NotificationPreferences | null | undefined,
  ): NotificationPreferences {
    return {
      ...defaultNotificationPreferences,
      ...(stored ?? {}),
    };
  }

  async notifyScheduleConflictIfEnabled(userId: string, detail: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return;
    }
    const prefs = this.mergePrefs(user.notificationPreferences);
    if (!prefs.inAppOnScheduleConflict) {
      return;
    }
    const row = this.notificationsRepository.create({
      userId,
      title: 'Schedule conflict',
      body: detail,
    });
    await this.notificationsRepository.save(row);
  }

  async notifyMaintenanceDueStub(userId: string, droneSerial: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return;
    }
    const prefs = this.mergePrefs(user.notificationPreferences);
    if (!prefs.emailOnMaintenanceDue) {
      return;
    }
    // Hook for SMTP / SendGrid — log-only in this build
    console.info(
      `[notifications] emailOnMaintenanceDue stub for user ${userId} drone ${droneSerial}`,
    );
  }

  async listUnread(userId: string, limit: number) {
    return this.notificationsRepository.findByUserId(userId, limit);
  }

  async markRead(userId: string, id: string) {
    const row = await this.notificationsRepository.findOne(id, userId);
    if (!row) {
      return null;
    }
    row.readAt = new Date();
    return this.notificationsRepository.save(row);
  }
}

import type { DeepPartial } from 'typeorm';
import { InAppNotification } from '../entities/in-app-notification.entity';

export abstract class INotificationsRepository {
  abstract create(props: DeepPartial<InAppNotification>): InAppNotification;
  abstract save(notification: InAppNotification): Promise<InAppNotification>;
  abstract findByUserId(
    userId: string,
    limit: number,
  ): Promise<InAppNotification[]>;
  abstract findOne(
    id: string,
    userId: string,
  ): Promise<InAppNotification | null>;
}

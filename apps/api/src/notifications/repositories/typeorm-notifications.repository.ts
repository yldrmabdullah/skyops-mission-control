import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { InAppNotification } from '../entities/in-app-notification.entity';
import { INotificationsRepository } from './notifications.repository.interface';

@Injectable()
export class TypeOrmNotificationsRepository implements INotificationsRepository {
  constructor(
    @InjectRepository(InAppNotification)
    private readonly repository: Repository<InAppNotification>,
  ) {}

  create(props: DeepPartial<InAppNotification>): InAppNotification {
    return this.repository.create(props);
  }

  async save(notification: InAppNotification): Promise<InAppNotification> {
    return this.repository.save(notification);
  }

  async findByUserId(
    userId: string,
    limit: number,
  ): Promise<InAppNotification[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findOne(id: string, userId: string): Promise<InAppNotification | null> {
    return this.repository.findOne({ where: { id, userId } });
  }
}

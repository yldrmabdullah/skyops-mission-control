import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { MaintenanceLog } from '../entities/maintenance-log.entity';
import { IMaintenanceLogsRepository } from './maintenance-logs.repository.interface';

@Injectable()
export class TypeOrmMaintenanceLogsRepository implements IMaintenanceLogsRepository {
  constructor(
    @InjectRepository(MaintenanceLog)
    private readonly repository: Repository<MaintenanceLog>,
  ) {}

  async findOne(id: string): Promise<MaintenanceLog | null> {
    return this.repository.findOne({ 
      where: { id },
      relations: { drone: true }
    });
  }

  async findAll(ownerId: string, options: any): Promise<[MaintenanceLog[], number]> {
    const where: any = { drone: { ownerId } };

    if (options.droneId) {
      where.droneId = options.droneId;
    }

    if (options.startDate || options.endDate) {
      if (options.startDate && options.endDate) {
        where.performedAt = Between(new Date(options.startDate), new Date(options.endDate));
      } else if (options.startDate) {
        where.performedAt = MoreThanOrEqual(new Date(options.startDate));
      } else if (options.endDate) {
        where.performedAt = LessThanOrEqual(new Date(options.endDate));
      }
    }

    return this.repository.findAndCount({
      where,
      skip: options.skip,
      take: options.take,
      relations: { drone: true },
      order: { performedAt: 'DESC' }
    });
  }

  async save(log: MaintenanceLog): Promise<MaintenanceLog> {
    return this.repository.save(log);
  }

  async countByDroneId(droneId: string): Promise<number> {
    return this.repository.count({ where: { droneId } });
  }

  create(props: any): MaintenanceLog {
    return this.repository.create(props) as unknown as MaintenanceLog;
  }
}

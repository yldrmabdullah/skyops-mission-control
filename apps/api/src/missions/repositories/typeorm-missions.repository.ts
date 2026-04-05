import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { DeepPartial } from 'typeorm';
import {
  Between,
  FindOptionsWhere,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import {
  Mission,
  ACTIVE_SCHEDULING_MISSION_STATUSES,
} from '../entities/mission.entity';
import { overlapActiveMissionWhere } from '../utils/mission-overlap.where';
import {
  IMissionsRepository,
  MissionListQueryOptions,
} from './missions.repository.interface';

@Injectable()
export class TypeOrmMissionsRepository implements IMissionsRepository {
  constructor(
    @InjectRepository(Mission)
    private readonly repository: Repository<Mission>,
  ) {}

  async findOne(id: string, ownerId: string): Promise<Mission | null> {
    return this.repository.findOne({
      where: { id, drone: { ownerId } },
      relations: { drone: true },
    });
  }

  async findOverlapping(
    droneId: string,
    start: Date,
    end: Date,
    excludeId?: string,
  ): Promise<Mission | null> {
    return this.repository.findOne({
      where: overlapActiveMissionWhere(droneId, start, end, excludeId),
    });
  }

  async findAll(
    ownerId: string,
    options: MissionListQueryOptions,
  ): Promise<[Mission[], number]> {
    const where: FindOptionsWhere<Mission> = { drone: { ownerId } };

    if (options.status) {
      where.status = options.status;
    }

    if (options.droneId) {
      where.droneId = options.droneId;
    }

    if (options.startDate || options.endDate) {
      if (options.startDate && options.endDate) {
        where.plannedStart = Between(
          new Date(options.startDate),
          new Date(options.endDate),
        );
      } else if (options.startDate) {
        where.plannedStart = MoreThanOrEqual(new Date(options.startDate));
      } else if (options.endDate) {
        where.plannedStart = LessThanOrEqual(new Date(options.endDate));
      }
    }

    return this.repository.findAndCount({
      where,
      skip: options.skip,
      take: options.take,
      relations: { drone: true },
      order: options.order ?? { plannedStart: 'ASC' },
    });
  }

  async save(mission: Mission): Promise<Mission> {
    return this.repository.save(mission);
  }

  create(props: DeepPartial<Mission>): Mission {
    return this.repository.create(props);
  }

  async countByDroneId(droneId: string): Promise<number> {
    return this.repository.count({ where: { droneId } });
  }

  async findActiveOnDrone(droneId: string): Promise<Mission | null> {
    return this.repository.findOne({
      where: {
        droneId,
        status: In(ACTIVE_SCHEDULING_MISSION_STATUSES),
      },
      order: { plannedStart: 'ASC' },
    });
  }
}

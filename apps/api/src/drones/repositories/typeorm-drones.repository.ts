import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Drone, DroneStatus } from '../entities/drone.entity';
import { IDronesRepository } from './drones.repository.interface';

@Injectable()
export class TypeOrmDronesRepository implements IDronesRepository {
  constructor(
    @InjectRepository(Drone)
    private readonly repository: Repository<Drone>,
  ) {}

  async findOne(id: string, ownerId: string): Promise<Drone | null> {
    return this.repository.findOne({
      where: { id, ownerId },
      relations: { maintenanceLogs: true },
    });
  }

  async findBySerialNumber(
    serialNumber: string,
    ownerId: string,
  ): Promise<Drone | null> {
    return this.repository.findOne({ where: { serialNumber, ownerId } });
  }

  async findAll(
    ownerId: string,
    options: {
      skip: number;
      take: number;
      status?: DroneStatus;
      search?: string;
      order?: FindOptionsOrder<Drone>;
    },
  ): Promise<[Drone[], number]> {
    const where: FindOptionsWhere<Drone> = { ownerId };
    if (options.status) {
      where.status = options.status;
    }
    if (options.search) {
      where.serialNumber = ILike(`%${options.search}%`);
    }
    const order: FindOptionsOrder<Drone> = options.order ?? {
      registeredAt: 'DESC',
    };
    return this.repository.findAndCount({
      where,
      skip: options.skip,
      take: options.take,
      order,
    });
  }

  async save(drone: Drone): Promise<Drone> {
    return this.repository.save(drone);
  }

  async remove(drone: Drone): Promise<void> {
    await this.repository.remove(drone);
  }

  async countByOwnerId(ownerId: string): Promise<number> {
    return this.repository.count({ where: { ownerId } });
  }
}

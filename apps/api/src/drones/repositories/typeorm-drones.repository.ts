import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Drone } from '../entities/drone.entity';
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
      relations: { maintenanceLogs: true }
    });
  }

  async findBySerialNumber(serialNumber: string, ownerId: string): Promise<Drone | null> {
    return this.repository.findOne({ where: { serialNumber, ownerId } });
  }

  async findAll(ownerId: string, options: { 
    skip: number; 
    take: number; 
    status?: string;
    search?: string;
    order?: any;
  }): Promise<[Drone[], number]> {
    const where: any = { ownerId };
    if (options.status) {
      where.status = options.status;
    }
    if (options.search) {
      where.serialNumber = ILike(`%${options.search}%`);
    }
    return this.repository.findAndCount({
      where,
      skip: options.skip,
      take: options.take,
      order: options.order || { registeredAt: 'DESC' },
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

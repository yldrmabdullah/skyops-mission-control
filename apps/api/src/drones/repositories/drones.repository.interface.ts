import type { FindOptionsOrder } from 'typeorm';
import { Drone, DroneModel, DroneStatus } from '../entities/drone.entity';

export abstract class IDronesRepository {
  abstract findOne(id: string, ownerId: string): Promise<Drone | null>;
  abstract findBySerialNumber(
    serialNumber: string,
    ownerId: string,
  ): Promise<Drone | null>;
  abstract findAll(
    ownerId: string,
    options: {
      skip: number;
      take: number;
      status?: DroneStatus;
      model?: DroneModel;
      search?: string;
      order?: FindOptionsOrder<Drone>;
    },
  ): Promise<[Drone[], number]>;
  abstract save(drone: Drone): Promise<Drone>;
  abstract remove(drone: Drone): Promise<void>;
  abstract countByOwnerId(ownerId: string): Promise<number>;
}

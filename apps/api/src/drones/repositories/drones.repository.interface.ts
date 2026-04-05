import { Drone } from '../entities/drone.entity';

export abstract class IDronesRepository {
  abstract findOne(id: string, ownerId: string): Promise<Drone | null>;
  abstract findBySerialNumber(serialNumber: string, ownerId: string): Promise<Drone | null>;
  abstract findAll(ownerId: string, options: { 
    skip: number; 
    take: number; 
    status?: string;
    search?: string;
    order?: any;
  }): Promise<[Drone[], number]>;
  abstract save(drone: Drone): Promise<Drone>;
  abstract remove(drone: Drone): Promise<void>;
  abstract countByOwnerId(ownerId: string): Promise<number>;
}

import { Mission } from '../entities/mission.entity';

export abstract class IMissionsRepository {
  abstract findOne(id: string, ownerId: string): Promise<Mission | null>;
  abstract findOverlapping(droneId: string, start: Date, end: Date, excludeId?: string): Promise<Mission | null>;
  abstract findAll(ownerId: string, options: {
    skip: number;
    take: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    droneId?: string;
    order?: any;
  }): Promise<[Mission[], number]>;
  abstract save(mission: Mission): Promise<Mission>;
  abstract create(props: any): Mission;
  abstract countByDroneId(droneId: string): Promise<number>;
  abstract findActiveOnDrone(droneId: string): Promise<Mission | null>;
}

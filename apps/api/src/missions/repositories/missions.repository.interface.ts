import type { DeepPartial, FindOptionsOrder } from 'typeorm';
import { Mission, MissionStatus } from '../entities/mission.entity';

export interface MissionListQueryOptions {
  skip: number;
  take: number;
  status?: MissionStatus;
  startDate?: string;
  endDate?: string;
  droneId?: string;
  order?: FindOptionsOrder<Mission>;
}

export abstract class IMissionsRepository {
  abstract findOne(id: string, ownerId: string): Promise<Mission | null>;
  abstract findOverlapping(
    droneId: string,
    start: Date,
    end: Date,
    excludeId?: string,
  ): Promise<Mission | null>;
  abstract findAll(
    ownerId: string,
    options: MissionListQueryOptions,
  ): Promise<[Mission[], number]>;
  abstract save(mission: Mission): Promise<Mission>;
  abstract create(props: DeepPartial<Mission>): Mission;
  abstract countByDroneId(droneId: string): Promise<number>;
  abstract findActiveOnDrone(droneId: string): Promise<Mission | null>;
}

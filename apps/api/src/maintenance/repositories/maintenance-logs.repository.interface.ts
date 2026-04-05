import type { DeepPartial } from 'typeorm';
import { MaintenanceLog } from '../entities/maintenance-log.entity';

export interface MaintenanceLogsListQueryOptions {
  skip: number;
  take: number;
  droneId?: string;
  startDate?: string;
  endDate?: string;
}

export abstract class IMaintenanceLogsRepository {
  abstract findOne(id: string): Promise<MaintenanceLog | null>;
  abstract findAll(
    ownerId: string,
    options: MaintenanceLogsListQueryOptions,
  ): Promise<[MaintenanceLog[], number]>;
  abstract save(log: MaintenanceLog): Promise<MaintenanceLog>;
  abstract countByDroneId(droneId: string): Promise<number>;
  abstract create(props: DeepPartial<MaintenanceLog>): MaintenanceLog;
}

import { MaintenanceLog } from '../entities/maintenance-log.entity';

export abstract class IMaintenanceLogsRepository {
  abstract findOne(id: string): Promise<MaintenanceLog | null>;
  abstract findAll(ownerId: string, options: any): Promise<[MaintenanceLog[], number]>;
  abstract save(log: MaintenanceLog): Promise<MaintenanceLog>;
  abstract countByDroneId(droneId: string): Promise<number>;
  abstract create(props: any): MaintenanceLog;
}

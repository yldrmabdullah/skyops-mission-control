import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { MaintenanceLog } from '../../maintenance/entities/maintenance-log.entity';
import { Mission } from '../../missions/entities/mission.entity';
import { numericTransformer } from '../../database/numeric.transformer';

export enum DroneModel {
  PHANTOM_4 = 'PHANTOM_4',
  MATRICE_300 = 'MATRICE_300',
  MAVIC_3_ENTERPRISE = 'MAVIC_3_ENTERPRISE',
}

export enum DroneStatus {
  AVAILABLE = 'AVAILABLE',
  IN_MISSION = 'IN_MISSION',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED',
}

@Entity({ name: 'drones' })
@Unique(['ownerId', 'serialNumber'])
export class Drone {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  ownerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  @Column({ type: 'varchar', length: 50 })
  serialNumber!: string;

  @Column({ type: 'enum', enum: DroneModel })
  model!: DroneModel;

  @Column({ type: 'enum', enum: DroneStatus, default: DroneStatus.AVAILABLE })
  status!: DroneStatus;

  @Column({
    type: 'numeric',
    precision: 8,
    scale: 1,
    default: 0,
    transformer: numericTransformer,
  })
  totalFlightHours!: number;

  @Column({
    type: 'numeric',
    precision: 8,
    scale: 1,
    default: 0,
    transformer: numericTransformer,
  })
  flightHoursAtLastMaintenance!: number;

  @Column({ type: 'timestamp with time zone' })
  lastMaintenanceDate!: Date;

  @Column({ type: 'timestamp with time zone' })
  nextMaintenanceDueDate!: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  registeredAt!: Date;

  @OneToMany(() => Mission, (mission) => mission.drone)
  missions!: Mission[];

  @OneToMany(() => MaintenanceLog, (maintenanceLog) => maintenanceLog.drone)
  maintenanceLogs!: MaintenanceLog[];
}

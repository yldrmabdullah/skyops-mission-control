import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Drone } from '../../drones/entities/drone.entity';
import { numericTransformer } from '../../database/numeric.transformer';

export enum MaintenanceType {
  ROUTINE_CHECK = 'ROUTINE_CHECK',
  BATTERY_REPLACEMENT = 'BATTERY_REPLACEMENT',
  MOTOR_REPAIR = 'MOTOR_REPAIR',
  FIRMWARE_UPDATE = 'FIRMWARE_UPDATE',
  FULL_OVERHAUL = 'FULL_OVERHAUL',
}

@Entity({ name: 'maintenance_logs' })
export class MaintenanceLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  droneId!: string;

  @ManyToOne(() => Drone, (drone) => drone.maintenanceLogs, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'droneId' })
  drone!: Drone;

  @Column({ type: 'enum', enum: MaintenanceType })
  type!: MaintenanceType;

  @Column({ type: 'varchar', length: 120 })
  technicianName!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'timestamp with time zone' })
  performedAt!: Date;

  @Column({
    type: 'numeric',
    precision: 8,
    scale: 1,
    transformer: numericTransformer,
  })
  flightHoursAtMaintenance!: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;
}

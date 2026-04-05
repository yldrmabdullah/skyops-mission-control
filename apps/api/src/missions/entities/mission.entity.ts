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

export enum MissionType {
  WIND_TURBINE_INSPECTION = 'WIND_TURBINE_INSPECTION',
  SOLAR_PANEL_SURVEY = 'SOLAR_PANEL_SURVEY',
  POWER_LINE_PATROL = 'POWER_LINE_PATROL',
}

export enum MissionStatus {
  PLANNED = 'PLANNED',
  PRE_FLIGHT_CHECK = 'PRE_FLIGHT_CHECK',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABORTED = 'ABORTED',
}

/** Missions that occupy the schedule; overlap checks ignore terminal statuses. */
export const ACTIVE_SCHEDULING_MISSION_STATUSES: MissionStatus[] = [
  MissionStatus.PLANNED,
  MissionStatus.PRE_FLIGHT_CHECK,
  MissionStatus.IN_PROGRESS,
];

@Entity({ name: 'missions' })
export class Mission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'enum', enum: MissionType })
  type!: MissionType;

  @Column({ type: 'uuid' })
  droneId!: string;

  @ManyToOne(() => Drone, (drone) => drone.missions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'droneId' })
  drone!: Drone;

  @Column({ type: 'varchar', length: 120 })
  pilotName!: string;

  @Column({ type: 'varchar', length: 180 })
  siteLocation!: string;

  @Column({ type: 'timestamp with time zone' })
  plannedStart!: Date;

  @Column({ type: 'timestamp with time zone' })
  plannedEnd!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  actualStart!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  actualEnd!: Date | null;

  @Column({ type: 'enum', enum: MissionStatus, default: MissionStatus.PLANNED })
  status!: MissionStatus;

  @Column({
    type: 'numeric',
    precision: 6,
    scale: 1,
    nullable: true,
    transformer: numericTransformer,
  })
  flightHoursLogged!: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  abortReason!: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;
}

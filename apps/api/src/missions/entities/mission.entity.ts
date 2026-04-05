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

const MISSION_TRANSITIONS: Record<MissionStatus, MissionStatus[]> = {
  [MissionStatus.PLANNED]: [MissionStatus.PRE_FLIGHT_CHECK, MissionStatus.ABORTED],
  [MissionStatus.PRE_FLIGHT_CHECK]: [MissionStatus.IN_PROGRESS, MissionStatus.ABORTED],
  [MissionStatus.IN_PROGRESS]: [MissionStatus.COMPLETED, MissionStatus.ABORTED],
  [MissionStatus.COMPLETED]: [],
  [MissionStatus.ABORTED]: [],
};

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

  assertCanTransitionTo(nextStatus: MissionStatus) {
    if (!MISSION_TRANSITIONS[this.status].includes(nextStatus)) {
      throw new Error(`Mission cannot transition from ${this.status} to ${nextStatus}.`);
    }
  }
}

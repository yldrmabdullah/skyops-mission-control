import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { NotificationPreferences } from '../notification-preferences.types';
import { OperatorRole } from '../operator-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 120 })
  fullName: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: OperatorRole.PILOT,
  })
  role: OperatorRole;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  notificationPreferences: NotificationPreferences;

  /** When set, this account operates in the manager's fleet (Pilot / Technician). */
  @Column({ type: 'uuid', nullable: true })
  workspaceOwnerId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'workspaceOwnerId' })
  workspaceOwner: User | null;

  @Column({ type: 'boolean', default: false })
  mustChangePassword: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

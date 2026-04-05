import type { Drone } from './drone.types';

export type MaintenanceType =
  | 'ROUTINE_CHECK'
  | 'BATTERY_REPLACEMENT'
  | 'MOTOR_REPAIR'
  | 'FIRMWARE_UPDATE'
  | 'FULL_OVERHAUL';

export type MaintenanceAttachment =
  | { type: 'url'; url: string }
  | {
      type: 'file';
      storedFileName: string;
      originalName: string;
      mimeType: string;
    };

export interface MaintenanceLog {
  id: string;
  droneId: string;
  type: MaintenanceType;
  technicianName: string;
  performedAt: string;
  flightHoursAtMaintenance: number;
  notes?: string | null;
  attachments?: MaintenanceAttachment[];
  drone?: Drone;
}

export interface CreateMaintenanceLogPayload {
  droneId: string;
  type: MaintenanceType;
  technicianName: string;
  notes?: string;
  performedAt: string;
  flightHoursAtMaintenance: number;
  attachmentUrls?: string[];
}

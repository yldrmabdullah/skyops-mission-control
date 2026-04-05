import type { MaintenanceLog } from './maintenance.types';
import type { Mission } from './mission.types';

export type DroneModel = 'PHANTOM_4' | 'MATRICE_300' | 'MAVIC_3_ENTERPRISE';

export type DroneStatus =
  | 'AVAILABLE'
  | 'IN_MISSION'
  | 'MAINTENANCE'
  | 'RETIRED';

export interface Drone {
  id: string;
  /** Present when API returns scoped fleet data (JWT owner). */
  ownerId?: string;
  serialNumber: string;
  model: DroneModel;
  status: DroneStatus;
  totalFlightHours: number;
  flightHoursAtLastMaintenance?: number;
  lastMaintenanceDate: string;
  nextMaintenanceDueDate: string;
  registeredAt?: string;
  missions?: Mission[];
  maintenanceLogs?: MaintenanceLog[];
  maintenanceDue?: boolean;
  /** True when drone should appear on dashboard maintenance watchlist (API list/detail). */
  maintenanceWatchlist?: boolean;
}

export interface CreateDronePayload {
  serialNumber: string;
  model: DroneModel;
  status?: DroneStatus;
  totalFlightHours?: number;
  lastMaintenanceDate: string;
  flightHoursAtLastMaintenance?: number;
}

export type UpdateDronePayload = Partial<CreateDronePayload>;

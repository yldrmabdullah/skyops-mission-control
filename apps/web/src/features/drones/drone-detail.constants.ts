import type { DroneModel, DroneStatus, MaintenanceType } from '../../types/api';

export const droneModels: DroneModel[] = [
  'PHANTOM_4',
  'MATRICE_300',
  'MAVIC_3_ENTERPRISE',
];

export const editableStatuses: DroneStatus[] = [
  'AVAILABLE',
  'MAINTENANCE',
  'RETIRED',
];

export const maintenanceTypes: MaintenanceType[] = [
  'ROUTINE_CHECK',
  'BATTERY_REPLACEMENT',
  'MOTOR_REPAIR',
  'FIRMWARE_UPDATE',
  'FULL_OVERHAUL',
];

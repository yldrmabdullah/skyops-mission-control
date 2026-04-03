import { formatEnumLabel, toDateInputValue } from '../../lib/format';
import type {
  CreateMaintenanceLogPayload,
  Drone,
  DroneModel,
  DroneStatus,
  MaintenanceType,
  UpdateDronePayload,
} from '../../types/api';

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

export function createDroneProfilePayload(formState: {
  serialNumber: string;
  model: DroneModel;
  status: DroneStatus;
  totalFlightHours: string;
  flightHoursAtLastMaintenance: string;
  lastMaintenanceDate: string;
}): UpdateDronePayload {
  return {
    serialNumber: formState.serialNumber.trim().toUpperCase(),
    model: formState.model,
    status: formState.status,
    totalFlightHours: Number(formState.totalFlightHours),
    flightHoursAtLastMaintenance: Number(
      formState.flightHoursAtLastMaintenance,
    ),
    lastMaintenanceDate: new Date(
      `${formState.lastMaintenanceDate}T00:00:00`,
    ).toISOString(),
  };
}

export function createDroneProfileFormState(drone: Drone) {
  return {
    serialNumber: drone.serialNumber,
    model: drone.model,
    status: drone.status,
    totalFlightHours: String(drone.totalFlightHours),
    flightHoursAtLastMaintenance: String(
      drone.flightHoursAtLastMaintenance ?? drone.totalFlightHours,
    ),
    lastMaintenanceDate: toDateInputValue(drone.lastMaintenanceDate),
  };
}

export function createMaintenanceLogFormState(totalFlightHours: number) {
  return {
    type: 'ROUTINE_CHECK' as MaintenanceType,
    technicianName: '',
    notes: '',
    performedAt: new Date().toISOString().slice(0, 10),
    flightHoursAtMaintenance: String(totalFlightHours),
  };
}

export function createMaintenanceLogPayload(
  droneId: string,
  formState: ReturnType<typeof createMaintenanceLogFormState>,
): CreateMaintenanceLogPayload {
  return {
    droneId,
    type: formState.type,
    technicianName: formState.technicianName.trim(),
    notes: formState.notes.trim() || undefined,
    performedAt: new Date(`${formState.performedAt}T00:00:00`).toISOString(),
    flightHoursAtMaintenance: Number(formState.flightHoursAtMaintenance),
  };
}

export { formatEnumLabel };

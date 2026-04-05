import { toDateInputValue } from '../../lib/format';
import { parseLocaleDecimal } from '../../lib/locale-number';
import type {
  CreateMaintenanceLogPayload,
  Drone,
  DroneModel,
  DroneStatus,
  MaintenanceType,
  UpdateDronePayload,
} from '../../types/api';

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
    totalFlightHours: parseLocaleDecimal(formState.totalFlightHours),
    flightHoursAtLastMaintenance: parseLocaleDecimal(
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
    attachmentUrlsRaw: '',
  };
}

function parseAttachmentUrls(raw: string): string[] {
  const parts = raw
    .split(/[\n,]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  return parts.slice(0, 5);
}

export function createMaintenanceLogPayload(
  droneId: string,
  formState: ReturnType<typeof createMaintenanceLogFormState>,
): CreateMaintenanceLogPayload {
  const attachmentUrls = parseAttachmentUrls(formState.attachmentUrlsRaw);

  return {
    droneId,
    type: formState.type,
    technicianName: formState.technicianName.trim(),
    notes: formState.notes.trim() || undefined,
    performedAt: new Date(`${formState.performedAt}T00:00:00`).toISOString(),
    flightHoursAtMaintenance: parseLocaleDecimal(
      formState.flightHoursAtMaintenance,
    ),
    ...(attachmentUrls.length ? { attachmentUrls } : {}),
  };
}

export type MaintenanceLogFormState = ReturnType<
  typeof createMaintenanceLogFormState
>;

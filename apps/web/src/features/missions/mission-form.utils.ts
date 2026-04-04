import { parseLocaleDecimal } from '../../lib/locale-number';
import type {
  CreateMissionPayload,
  Mission,
  MissionStatus,
  MissionType,
  TransitionMissionPayload,
} from '../../types/api';

export const missionTypes: MissionType[] = [
  'WIND_TURBINE_INSPECTION',
  'SOLAR_PANEL_SURVEY',
  'POWER_LINE_PATROL',
];

export const missionStatuses: MissionStatus[] = [
  'PLANNED',
  'PRE_FLIGHT_CHECK',
  'IN_PROGRESS',
  'COMPLETED',
  'ABORTED',
];

export interface MissionFormState {
  name: string;
  type: MissionType;
  droneId: string;
  pilotName: string;
  siteLocation: string;
  plannedStart: string;
  plannedEnd: string;
}

export interface TransitionFormState {
  status: MissionStatus;
  actualStart: string;
  actualEnd: string;
  flightHoursLogged: string;
  abortReason: string;
}

export function getInitialMissionDates() {
  const start = new Date(Date.now() + 60 * 60 * 1000);
  const end = new Date(Date.now() + 2 * 60 * 60 * 1000);

  return {
    plannedStart: new Date(start.getTime() - start.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16),
    plannedEnd: new Date(end.getTime() - end.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16),
  };
}

export function createMissionFormState(): MissionFormState {
  const initialDates = getInitialMissionDates();

  return {
    name: '',
    type: 'WIND_TURBINE_INSPECTION',
    droneId: '',
    pilotName: '',
    siteLocation: '',
    plannedStart: initialDates.plannedStart,
    plannedEnd: initialDates.plannedEnd,
  };
}

export function getAllowedTransitions(status: MissionStatus): MissionStatus[] {
  switch (status) {
    case 'PLANNED':
      return ['PRE_FLIGHT_CHECK', 'ABORTED'];
    case 'PRE_FLIGHT_CHECK':
      return ['IN_PROGRESS', 'ABORTED'];
    case 'IN_PROGRESS':
      return ['COMPLETED', 'ABORTED'];
    default:
      return [];
  }
}

export function toDateTimeLocalValue(value: string) {
  const date = new Date(value);

  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function createMissionEditForm(mission: Mission): MissionFormState {
  return {
    name: mission.name,
    type: mission.type,
    droneId: mission.droneId,
    pilotName: mission.pilotName,
    siteLocation: mission.siteLocation,
    plannedStart: toDateTimeLocalValue(mission.plannedStart),
    plannedEnd: toDateTimeLocalValue(mission.plannedEnd),
  };
}

export function createTransitionForm(
  status: MissionStatus,
): TransitionFormState {
  return {
    status: getAllowedTransitions(status)[0] ?? status,
    actualStart: '',
    actualEnd: '',
    flightHoursLogged: '',
    abortReason: '',
  };
}

export function missionFormToPayload(
  formState: MissionFormState,
): CreateMissionPayload {
  return {
    name: formState.name.trim(),
    type: formState.type,
    droneId: formState.droneId,
    pilotName: formState.pilotName.trim(),
    siteLocation: formState.siteLocation.trim(),
    plannedStart: new Date(formState.plannedStart).toISOString(),
    plannedEnd: new Date(formState.plannedEnd).toISOString(),
  };
}

export function transitionFormToPayload(
  formState: TransitionFormState,
  activeStatus: MissionStatus,
): TransitionMissionPayload {
  return {
    status: activeStatus,
    actualStart: formState.actualStart
      ? new Date(formState.actualStart).toISOString()
      : undefined,
    actualEnd: formState.actualEnd
      ? new Date(formState.actualEnd).toISOString()
      : undefined,
    flightHoursLogged: (() => {
      if (!formState.flightHoursLogged?.trim()) {
        return undefined;
      }
      const n = parseLocaleDecimal(formState.flightHoursLogged);
      return Number.isFinite(n) ? n : undefined;
    })(),
    abortReason: formState.abortReason || undefined,
  };
}

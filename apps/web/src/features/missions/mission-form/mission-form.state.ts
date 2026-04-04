import type { Mission } from '../../../types/api';
import type { MissionFormState } from './mission-form.types';

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

import { parseLocaleDecimal } from '../../../lib/locale-number';
import type {
  CreateMissionPayload,
  MissionStatus,
  TransitionMissionPayload,
} from '../../../types/api';
import type {
  MissionFormState,
  TransitionFormState,
} from './mission-form.types';

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

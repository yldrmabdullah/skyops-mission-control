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
  const payload: TransitionMissionPayload = {
    status: activeStatus,
    actualStart: formState.actualStart
      ? new Date(formState.actualStart).toISOString()
      : undefined,
    actualEnd: formState.actualEnd
      ? new Date(formState.actualEnd).toISOString()
      : undefined,
    abortReason: formState.abortReason || undefined,
  };

  if (activeStatus === 'COMPLETED') {
    const raw = formState.flightHoursLogged?.trim();
    if (raw) {
      const n = parseLocaleDecimal(raw);
      if (Number.isFinite(n) && n >= 0.1) {
        payload.flightHoursLogged = n;
      }
    }
  }

  return payload;
}

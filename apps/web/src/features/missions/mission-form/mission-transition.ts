import type { MissionStatus } from '../../../types/api';
import type { TransitionFormState } from './mission-form.types';

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

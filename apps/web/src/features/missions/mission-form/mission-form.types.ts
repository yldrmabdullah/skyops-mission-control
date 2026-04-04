import type { MissionStatus, MissionType } from '../../../types/api';

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

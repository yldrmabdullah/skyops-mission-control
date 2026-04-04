import type { Drone } from './drone.types';

export type MissionType =
  | 'WIND_TURBINE_INSPECTION'
  | 'SOLAR_PANEL_SURVEY'
  | 'POWER_LINE_PATROL';

export type MissionStatus =
  | 'PLANNED'
  | 'PRE_FLIGHT_CHECK'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ABORTED';

export interface Mission {
  id: string;
  name: string;
  type: MissionType;
  droneId: string;
  pilotName: string;
  siteLocation: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  status: MissionStatus;
  flightHoursLogged?: number | null;
  abortReason?: string | null;
  drone?: Drone;
}

export interface CreateMissionPayload {
  name: string;
  type: MissionType;
  droneId: string;
  pilotName: string;
  siteLocation: string;
  plannedStart: string;
  plannedEnd: string;
}

export interface ListMissionsParams {
  page?: number;
  limit?: number;
  status?: MissionStatus;
  droneId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface TransitionMissionPayload {
  status: MissionStatus;
  actualStart?: string;
  actualEnd?: string;
  flightHoursLogged?: number;
  abortReason?: string;
}

export interface UpdateMissionPayload {
  name?: string;
  type?: MissionType;
  droneId?: string;
  pilotName?: string;
  siteLocation?: string;
  plannedStart?: string;
  plannedEnd?: string;
}

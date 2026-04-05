import type { MissionStatus, MissionType } from '../../../types/api';

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

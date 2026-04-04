export type DroneModel = 'PHANTOM_4' | 'MATRICE_300' | 'MAVIC_3_ENTERPRISE';

export type DroneStatus =
  | 'AVAILABLE'
  | 'IN_MISSION'
  | 'MAINTENANCE'
  | 'RETIRED';

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

export type MaintenanceType =
  | 'ROUTINE_CHECK'
  | 'BATTERY_REPLACEMENT'
  | 'MOTOR_REPAIR'
  | 'FIRMWARE_UPDATE'
  | 'FULL_OVERHAUL';

export interface Drone {
  id: string;
  /** Present when API returns scoped fleet data (JWT owner). */
  ownerId?: string;
  serialNumber: string;
  model: DroneModel;
  status: DroneStatus;
  totalFlightHours: number;
  flightHoursAtLastMaintenance?: number;
  lastMaintenanceDate: string;
  nextMaintenanceDueDate: string;
  registeredAt?: string;
  missions?: Mission[];
  maintenanceLogs?: MaintenanceLog[];
  maintenanceDue?: boolean;
}

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

export interface MaintenanceLog {
  id: string;
  droneId: string;
  type: MaintenanceType;
  technicianName: string;
  performedAt: string;
  flightHoursAtMaintenance: number;
  notes?: string | null;
  drone?: Drone;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FleetHealthReport {
  totalDroneCount: number;
  statusBreakdown: Record<string, number>;
  overdueMaintenance: Drone[];
  missionsInNext24Hours: number;
  averageFlightHoursPerDrone: number;
}

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

export interface CreateDronePayload {
  serialNumber: string;
  model: DroneModel;
  status?: DroneStatus;
  totalFlightHours?: number;
  lastMaintenanceDate: string;
  flightHoursAtLastMaintenance?: number;
}

export type UpdateDronePayload = Partial<CreateDronePayload>;

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
  status?: MissionStatus;
  droneId?: string;
  startDate?: string;
  endDate?: string;
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

export interface CreateMaintenanceLogPayload {
  droneId: string;
  type: MaintenanceType;
  technicianName: string;
  notes?: string;
  performedAt: string;
  flightHoursAtMaintenance: number;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  user: AuthUser;
}

export interface AuthProfile extends AuthUser {
  createdAt: string;
}

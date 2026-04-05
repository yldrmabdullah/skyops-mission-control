import type { Drone } from './drone.types';

export interface FleetHealthReport {
  totalDroneCount: number;
  statusBreakdown: Record<string, number>;
  overdueMaintenance: Drone[];
  missionsInNext24Hours: number;
  averageFlightHoursPerDrone: number;
}

export interface OperationalAnalytics {
  missionStatusBreakdown: Record<string, number>;
  droneModelBreakdown: Record<string, number>;
  maintenanceByTechnician: { technicianName: string; count: number }[];
}

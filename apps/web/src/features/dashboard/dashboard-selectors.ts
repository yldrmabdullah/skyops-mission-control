import type { Drone, Mission } from '../../types/api';

const MAINTENANCE_WATCHLIST_LIMIT = 6;
const UPCOMING_MISSION_LIMIT = 4;
const RECENT_MISSION_LIMIT = 4;

export function selectMaintenanceWatchlistDrones(drones: Drone[]): Drone[] {
  return drones
    .filter((drone) => drone.maintenanceWatchlist === true)
    .sort(
      (left, right) =>
        new Date(left.nextMaintenanceDueDate).getTime() -
        new Date(right.nextMaintenanceDueDate).getTime(),
    )
    .slice(0, MAINTENANCE_WATCHLIST_LIMIT);
}

export function selectUpcomingMissions(
  missions: Mission[],
  referenceNow: number,
): Mission[] {
  return missions
    .filter(
      (mission) => new Date(mission.plannedStart).getTime() >= referenceNow,
    )
    .sort(
      (left, right) =>
        new Date(left.plannedStart).getTime() -
        new Date(right.plannedStart).getTime(),
    )
    .slice(0, UPCOMING_MISSION_LIMIT);
}

export function selectRecentMissions(
  missions: Mission[],
  referenceNow: number,
): Mission[] {
  return missions
    .filter(
      (mission) => new Date(mission.plannedStart).getTime() < referenceNow,
    )
    .sort(
      (left, right) =>
        new Date(right.actualEnd ?? right.plannedStart).getTime() -
        new Date(left.actualEnd ?? left.plannedStart).getTime(),
    )
    .slice(0, RECENT_MISSION_LIMIT);
}

export function missionAnalyticsBarScale(breakdown: Record<string, number>): {
  entries: [string, number][];
  max: number;
} {
  const entries = Object.entries(breakdown);
  const max = Math.max(...entries.map(([, count]) => count), 1);
  return { entries, max };
}

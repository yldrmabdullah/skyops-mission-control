import { BadRequestException } from '@nestjs/common';
import type { Mission } from '../../missions/entities/mission.entity';
import { MissionStatus } from '../../missions/entities/mission.entity';
import { DroneStatus, type Drone } from '../entities/drone.entity';
import { isMaintenanceDue } from './maintenance.utils';

export function assertValidFlightHoursSnapshot(
  totalFlightHours: number,
  flightHoursAtLastMaintenance: number,
) {
  if (flightHoursAtLastMaintenance > totalFlightHours) {
    throw new BadRequestException(
      'Flight hours at last maintenance cannot exceed total flight hours.',
    );
  }
}

export function assertDroneCanBeRetired(upcomingMission: Mission | null) {
  if (
    upcomingMission &&
    upcomingMission.status !== MissionStatus.COMPLETED &&
    upcomingMission.status !== MissionStatus.ABORTED
  ) {
    throw new BadRequestException(
      'A drone with upcoming scheduled missions cannot be retired.',
    );
  }
}

export function assertDroneCanBeDeleted(
  relatedMissionCount: number,
  relatedMaintenanceLogCount: number,
) {
  if (relatedMissionCount > 0 || relatedMaintenanceLogCount > 0) {
    throw new BadRequestException(
      'A drone with mission or maintenance history cannot be deleted.',
    );
  }
}

export function resolveDroneStatusAfterMaintenance(currentStatus: DroneStatus) {
  return currentStatus === DroneStatus.RETIRED
    ? DroneStatus.RETIRED
    : DroneStatus.AVAILABLE;
}

export function resolveDroneStatusAfterMissionCompletion(drone: Drone) {
  return isMaintenanceDue({
    totalFlightHours: drone.totalFlightHours,
    flightHoursAtLastMaintenance: drone.flightHoursAtLastMaintenance,
    nextMaintenanceDueDate: drone.nextMaintenanceDueDate,
  })
    ? DroneStatus.MAINTENANCE
    : DroneStatus.AVAILABLE;
}

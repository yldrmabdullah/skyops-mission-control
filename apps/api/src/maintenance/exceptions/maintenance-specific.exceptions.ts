import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/exceptions/domain.exception';

export class DroneInMissionException extends DomainException {
  constructor(droneId: string) {
    super(
      `Drone ${droneId} is currently in mission and cannot receive maintenance`,
      'DRONE_IN_MISSION',
      HttpStatus.BAD_REQUEST,
      { droneId },
    );
  }
}

export class FlightHourMismatchException extends DomainException {
  constructor(droneId: string, expected: number, provided: number) {
    super(
      'Recorded flight hours at maintenance must be consistent with the drone total flight hours.',
      'FLIGHT_HOUR_MISMATCH',
      HttpStatus.BAD_REQUEST,
      { droneId, expected, provided },
    );
  }
}

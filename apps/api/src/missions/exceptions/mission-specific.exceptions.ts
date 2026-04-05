import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/exceptions/domain.exception';

export class MissionOverlapException extends DomainException {
  constructor(droneId: string, start: Date, end: Date) {
    super(
      `Drone ${droneId} already has a scheduled mission between ${start.toISOString()} and ${end.toISOString()}`,
      'MISSION_OVERLAP',
      HttpStatus.BAD_REQUEST,
      { droneId, start, end },
    );
  }
}

export class DroneNotAvailableException extends DomainException {
  constructor(droneId: string, status: string) {
    super(
      `Drone ${droneId} is currently ${status} and cannot be assigned to a new mission`,
      'DRONE_NOT_AVAILABLE',
      HttpStatus.BAD_REQUEST,
      { droneId, status },
    );
  }
}

export class MissionNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Mission with ID ${id} not found`, 'MISSION_NOT_FOUND', HttpStatus.NOT_FOUND, {
      id,
    });
  }
}

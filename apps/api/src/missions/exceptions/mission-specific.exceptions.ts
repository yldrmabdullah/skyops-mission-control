import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/exceptions/domain.exception';

/** Mission row missing for workspace scope. */
export class MissionNotFoundException extends DomainException {
  constructor(id: string) {
    super(
      `Mission ${id} was not found.`,
      'MISSION_NOT_FOUND',
      HttpStatus.NOT_FOUND,
      {
        id,
      },
    );
  }
}

/** Drone missing or not in caller workspace. */
export class DroneNotFoundException extends DomainException {
  constructor(droneId: string) {
    super(
      `Drone ${droneId} was not found.`,
      'DRONE_NOT_FOUND',
      HttpStatus.NOT_FOUND,
      {
        droneId,
      },
    );
  }
}

/** Planned window is empty or inverted. */
export class InvalidMissionScheduleException extends DomainException {
  constructor(
    message = 'Planned start must be before planned end.',
    details?: Record<string, unknown>,
  ) {
    super(message, 'MISSION_INVALID_SCHEDULE', HttpStatus.BAD_REQUEST, details);
  }
}

/** Another active mission already occupies this drone’s window. */
export class MissionScheduleOverlapException extends DomainException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'MISSION_SCHEDULE_OVERLAP', HttpStatus.CONFLICT, details);
  }
}

/** Drone cannot take a new mission (wrong operational status). */
export class DroneUnavailableForNewMissionException extends DomainException {
  constructor(droneId: string, status: string) {
    super(
      `Drone ${droneId} is not available for a new mission.`,
      'DRONE_UNAVAILABLE_FOR_MISSION',
      HttpStatus.BAD_REQUEST,
      { droneId, status },
    );
  }
}

/** Only PLANNED missions accept the kinds of edits this use case performs. */
export class MissionNotPlannedForUpdateException extends DomainException {
  constructor() {
    super(
      'Only planned missions can be updated.',
      'MISSION_NOT_PLANNED',
      HttpStatus.CONFLICT,
    );
  }
}

/** Reassigning to a drone that exists but is not AVAILABLE. */
export class ReplacementDroneUnavailableException extends DomainException {
  constructor() {
    super(
      'New drone is not available.',
      'REPLACEMENT_DRONE_UNAVAILABLE',
      HttpStatus.CONFLICT,
    );
  }
}

/** Lifecycle graph violation (invalid status edge). */
export class InvalidMissionTransitionException extends DomainException {
  constructor(from: string, to: string) {
    super(
      `Mission cannot transition from ${from} to ${to}.`,
      'MISSION_INVALID_TRANSITION',
      HttpStatus.BAD_REQUEST,
      { from, to },
    );
  }
}

/** Drone not in AVAILABLE when starting flight. */
export class MissionStartDroneUnavailableException extends DomainException {
  constructor(droneId: string) {
    super(
      `Drone ${droneId} is not available.`,
      'DRONE_NOT_AVAILABLE',
      HttpStatus.CONFLICT,
      {
        droneId,
      },
    );
  }
}

export class MissionCompletionRequiresFlightHoursException extends DomainException {
  constructor() {
    super(
      'Completing a mission requires flight hours.',
      'MISSION_COMPLETION_REQUIRES_HOURS',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class MissionAbortRequiresReasonException extends DomainException {
  constructor() {
    super(
      'Aborting a mission requires a reason.',
      'MISSION_ABORT_REQUIRES_REASON',
      HttpStatus.BAD_REQUEST,
    );
  }
}

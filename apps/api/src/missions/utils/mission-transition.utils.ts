import { MissionStatus } from '../entities/mission.entity';
import { InvalidMissionTransitionException } from '../exceptions/mission-specific.exceptions';

/**
 * Mission status transition graph (single source of truth).
 * For richer rules later, evolve toward explicit State Pattern classes per status
 * (e.g. PlannedState.transition(event)) while keeping this graph or delegating to it.
 */
export const MISSION_TRANSITIONS: Record<MissionStatus, MissionStatus[]> = {
  [MissionStatus.PLANNED]: [
    MissionStatus.PRE_FLIGHT_CHECK,
    MissionStatus.ABORTED,
  ],
  [MissionStatus.PRE_FLIGHT_CHECK]: [
    MissionStatus.IN_PROGRESS,
    MissionStatus.ABORTED,
  ],
  [MissionStatus.IN_PROGRESS]: [MissionStatus.COMPLETED, MissionStatus.ABORTED],
  [MissionStatus.COMPLETED]: [],
  [MissionStatus.ABORTED]: [],
};

export function canTransitionMission(
  currentStatus: MissionStatus,
  nextStatus: MissionStatus,
): boolean {
  return MISSION_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function assertValidMissionTransition(
  currentStatus: MissionStatus,
  nextStatus: MissionStatus,
) {
  if (!canTransitionMission(currentStatus, nextStatus)) {
    throw new InvalidMissionTransitionException(currentStatus, nextStatus);
  }
}

/**
 * Thin domain façade for mission lifecycle transitions (Clean Architecture entry point).
 * Side effects (drone status, timestamps) stay in the use case; this only validates the graph.
 */
export class MissionStateMachine {
  static canTransition(from: MissionStatus, to: MissionStatus): boolean {
    return canTransitionMission(from, to);
  }

  static assertTransition(from: MissionStatus, to: MissionStatus): void {
    assertValidMissionTransition(from, to);
  }
}

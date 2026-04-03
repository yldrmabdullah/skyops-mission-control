import { BadRequestException } from '@nestjs/common';
import { MissionStatus } from '../entities/mission.entity';

const missionTransitions: Record<MissionStatus, MissionStatus[]> = {
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

export function assertValidMissionTransition(
  currentStatus: MissionStatus,
  nextStatus: MissionStatus,
) {
  if (!missionTransitions[currentStatus].includes(nextStatus)) {
    throw new BadRequestException(
      `Mission cannot transition from ${currentStatus} to ${nextStatus}.`,
    );
  }
}

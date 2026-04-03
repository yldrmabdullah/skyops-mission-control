import { BadRequestException } from '@nestjs/common';
import { MissionStatus } from '../entities/mission.entity';
import { assertValidMissionTransition } from './mission-transition.utils';

describe('assertValidMissionTransition', () => {
  it('allows valid mission transitions', () => {
    expect(() =>
      assertValidMissionTransition(
        MissionStatus.PLANNED,
        MissionStatus.PRE_FLIGHT_CHECK,
      ),
    ).not.toThrow();

    expect(() =>
      assertValidMissionTransition(
        MissionStatus.IN_PROGRESS,
        MissionStatus.COMPLETED,
      ),
    ).not.toThrow();
  });

  it('rejects invalid mission transitions', () => {
    expect(() =>
      assertValidMissionTransition(
        MissionStatus.PLANNED,
        MissionStatus.COMPLETED,
      ),
    ).toThrow(BadRequestException);
  });
});

import { MissionStatus } from '../entities/mission.entity';
import { InvalidMissionTransitionException } from '../exceptions/mission-specific.exceptions';
import {
  assertValidMissionTransition,
  canTransitionMission,
  MissionStateMachine,
} from './mission-transition.utils';

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
    ).toThrow(InvalidMissionTransitionException);
  });
});

describe('canTransitionMission', () => {
  it('returns true for allowed edges', () => {
    expect(
      canTransitionMission(
        MissionStatus.PLANNED,
        MissionStatus.PRE_FLIGHT_CHECK,
      ),
    ).toBe(true);
  });

  it('returns false for disallowed edges', () => {
    expect(
      canTransitionMission(MissionStatus.PLANNED, MissionStatus.COMPLETED),
    ).toBe(false);
  });
});

describe('MissionStateMachine', () => {
  it('delegates assertTransition to assertValidMissionTransition', () => {
    expect(() =>
      MissionStateMachine.assertTransition(
        MissionStatus.PLANNED,
        MissionStatus.COMPLETED,
      ),
    ).toThrow(InvalidMissionTransitionException);
  });

  it('exposes canTransition', () => {
    expect(
      MissionStateMachine.canTransition(
        MissionStatus.IN_PROGRESS,
        MissionStatus.COMPLETED,
      ),
    ).toBe(true);
  });
});

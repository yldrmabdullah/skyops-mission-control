import {
  FindOptionsWhere,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
} from 'typeorm';
import {
  Mission,
  ACTIVE_SCHEDULING_MISSION_STATUSES,
} from '../entities/mission.entity';

export function overlapActiveMissionWhere(
  droneId: string,
  start: Date,
  end: Date,
  excludeMissionId?: string,
): FindOptionsWhere<Mission> {
  const base: FindOptionsWhere<Mission> = {
    droneId,
    status: In(ACTIVE_SCHEDULING_MISSION_STATUSES),
    plannedStart: LessThanOrEqual(end),
    plannedEnd: MoreThanOrEqual(start),
  };
  return excludeMissionId ? { ...base, id: Not(excludeMissionId) } : base;
}

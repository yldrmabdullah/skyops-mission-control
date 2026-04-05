import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { WorkspaceContext } from '../../common/workspace-context/workspace-context';
import { CreateMissionDto } from '../dto/create-mission.dto';
import { parseIsoDateOrThrow } from '../../common/utils/date.utils';
import { Mission, MissionStatus } from '../entities/mission.entity';
import { Drone, DroneStatus } from '../../drones/entities/drone.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { overlapActiveMissionWhere } from '../utils/mission-overlap.where';
import {
  DroneNotFoundException,
  DroneUnavailableForNewMissionException,
  InvalidMissionScheduleException,
  MissionScheduleOverlapException,
} from '../exceptions/mission-specific.exceptions';

@Injectable()
export class CreateMissionUseCase {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly workspaceContext: WorkspaceContext,
    private readonly notificationsService: NotificationsService,
  ) {}

  async execute(dto: CreateMissionDto) {
    const fleetOwnerId = this.workspaceContext.fleetOwnerId;

    const plannedStart = parseIsoDateOrThrow(dto.plannedStart, 'Planned start');
    const plannedEnd = parseIsoDateOrThrow(dto.plannedEnd, 'Planned end');

    if (plannedStart >= plannedEnd) {
      throw new InvalidMissionScheduleException();
    }

    /**
     * Pessimistic lock on the drone row serializes concurrent scheduling for the same drone
     * under READ COMMITTED (overlap check + insert are atomic per drone).
     */
    return this.dataSource.transaction(async (manager) => {
      const drone = await manager.findOne(Drone, {
        where: { id: dto.droneId, ownerId: fleetOwnerId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!drone) {
        throw new DroneNotFoundException(dto.droneId);
      }

      if (drone.status !== DroneStatus.AVAILABLE) {
        throw new DroneUnavailableForNewMissionException(
          dto.droneId,
          drone.status,
        );
      }

      const overlap = await manager.findOne(Mission, {
        where: overlapActiveMissionWhere(dto.droneId, plannedStart, plannedEnd),
      });
      if (overlap) {
        void this.notificationsService
          .notifyScheduleConflictIfEnabled(
            fleetOwnerId,
            'This drone already has an overlapping active mission in the selected window.',
          )
          .catch(() => undefined);
        throw new MissionScheduleOverlapException(
          'This drone already has a mission scheduled during this time window.',
        );
      }

      const mission = manager.create(Mission, {
        ...dto,
        plannedStart,
        plannedEnd,
        status: MissionStatus.PLANNED,
      });
      return manager.save(mission);
    });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { WorkspaceContext } from '../../common/workspace-context/workspace-context';
import { UpdateMissionDto } from '../dto/update-mission.dto';
import { parseIsoDateOrThrow } from '../../common/utils/date.utils';
import { Mission, MissionStatus } from '../entities/mission.entity';
import { Drone, DroneStatus } from '../../drones/entities/drone.entity';
import { overlapActiveMissionWhere } from '../utils/mission-overlap.where';
import {
  DroneNotFoundException,
  InvalidMissionScheduleException,
  MissionNotPlannedForUpdateException,
  MissionNotFoundException,
  MissionScheduleOverlapException,
  ReplacementDroneUnavailableException,
} from '../exceptions/mission-specific.exceptions';

@Injectable()
export class UpdateMissionUseCase {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly workspaceContext: WorkspaceContext,
  ) {}

  async execute(id: string, dto: UpdateMissionDto) {
    const fleetOwnerId = this.workspaceContext.fleetOwnerId;

    return this.dataSource.transaction(async (manager) => {
      const mission = await manager.findOne(Mission, {
        where: { id, drone: { ownerId: fleetOwnerId } },
        relations: { drone: true },
      });
      if (!mission) {
        throw new MissionNotFoundException(id);
      }

      if (mission.status !== MissionStatus.PLANNED) {
        throw new MissionNotPlannedForUpdateException();
      }

      if (dto.droneId && dto.droneId !== mission.droneId) {
        const nextDrone = await manager.findOne(Drone, {
          where: { id: dto.droneId, ownerId: fleetOwnerId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!nextDrone) {
          throw new DroneNotFoundException(dto.droneId);
        }
        if (nextDrone.status !== DroneStatus.AVAILABLE) {
          throw new ReplacementDroneUnavailableException();
        }
        mission.droneId = dto.droneId;
      }

      const schedulingChanged = Boolean(
        dto.plannedStart || dto.plannedEnd || dto.droneId,
      );

      if (schedulingChanged) {
        const scheduleDroneId = mission.droneId;
        await manager.findOne(Drone, {
          where: { id: scheduleDroneId, ownerId: fleetOwnerId },
          lock: { mode: 'pessimistic_write' },
        });

        const start = dto.plannedStart
          ? parseIsoDateOrThrow(dto.plannedStart, 'Planned start')
          : mission.plannedStart;
        const end = dto.plannedEnd
          ? parseIsoDateOrThrow(dto.plannedEnd, 'Planned end')
          : mission.plannedEnd;

        if (start >= end) {
          throw new InvalidMissionScheduleException(
            'Planned start must be before planned end.',
          );
        }

        const overlap = await manager.findOne(Mission, {
          where: overlapActiveMissionWhere(scheduleDroneId, start, end, id),
        });
        if (overlap) {
          throw new MissionScheduleOverlapException(
            'This drone already has another mission scheduled during this time window.',
          );
        }

        mission.plannedStart = start;
        mission.plannedEnd = end;
      }

      if (dto.name) mission.name = dto.name;
      if (dto.type) mission.type = dto.type;
      if (dto.pilotName) mission.pilotName = dto.pilotName;
      if (dto.siteLocation) mission.siteLocation = dto.siteLocation;

      return manager.save(mission);
    });
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { IMissionsRepository } from '../repositories/missions.repository.interface';
import { WorkspaceContext } from '../../common/workspace-context/workspace-context';
import { UpdateMissionDto } from '../dto/update-mission.dto';
import { parseIsoDateOrThrow } from '../../common/utils/date.utils';
import { MissionStatus } from '../entities/mission.entity';
import { IDronesRepository } from '../../drones/repositories/drones.repository.interface';
import { DroneStatus } from '../../drones/entities/drone.entity';

@Injectable()
export class UpdateMissionUseCase {
  constructor(
    private readonly missionsRepository: IMissionsRepository,
    private readonly dronesRepository: IDronesRepository,
    private readonly workspaceContext: WorkspaceContext,
  ) {}

  async execute(id: string, dto: UpdateMissionDto) {
    const fleetOwnerId = this.workspaceContext.fleetOwnerId;

    const mission = await this.missionsRepository.findOne(id, fleetOwnerId);
    if (!mission) {
      throw new NotFoundException(`Mission ${id} was not found.`);
    }

    if (mission.status !== MissionStatus.PLANNED) {
      throw new ConflictException('Only planned missions can be updated.');
    }

    if (dto.droneId && dto.droneId !== mission.droneId) {
      const nextDrone = await this.dronesRepository.findOne(
        dto.droneId,
        fleetOwnerId,
      );
      if (!nextDrone) {
        throw new NotFoundException(`Drone ${dto.droneId} was not found.`);
      }
      if (nextDrone.status !== DroneStatus.AVAILABLE) {
        throw new ConflictException('New drone is not available.');
      }
      mission.droneId = dto.droneId;
    }

    if (dto.plannedStart || dto.plannedEnd || dto.droneId) {
      const start = dto.plannedStart
        ? parseIsoDateOrThrow(dto.plannedStart, 'Planned start')
        : mission.plannedStart;
      const end = dto.plannedEnd
        ? parseIsoDateOrThrow(dto.plannedEnd, 'Planned end')
        : mission.plannedEnd;

      if (start >= end) {
        throw new ConflictException(
          'Planned start must be before planned end.',
        );
      }

      const overlap = await this.missionsRepository.findOverlapping(
        mission.droneId,
        start,
        end,
        id,
      );
      if (overlap) {
        throw new ConflictException(
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

    return this.missionsRepository.save(mission);
  }
}

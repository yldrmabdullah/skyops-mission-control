import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IMissionsRepository } from '../repositories/missions.repository.interface';
import { IDronesRepository } from '../../drones/repositories/drones.repository.interface';
import { WorkspaceContext } from '../../common/workspace-context/workspace-context';
import { CreateMissionDto } from '../dto/create-mission.dto';
import { parseIsoDateOrThrow } from '../../common/utils/date.utils';
import { MissionStatus } from '../entities/mission.entity';
import { DroneStatus } from '../../drones/entities/drone.entity';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class CreateMissionUseCase {
  constructor(
    private readonly missionsRepository: IMissionsRepository,
    private readonly dronesRepository: IDronesRepository,
    private readonly workspaceContext: WorkspaceContext,
    private readonly notificationsService: NotificationsService,
  ) {}

  async execute(dto: CreateMissionDto) {
    const fleetOwnerId = this.workspaceContext.fleetOwnerId;

    const plannedStart = parseIsoDateOrThrow(dto.plannedStart, 'Planned start');
    const plannedEnd = parseIsoDateOrThrow(dto.plannedEnd, 'Planned end');

    // Validation
    const drone = await this.dronesRepository.findOne(
      dto.droneId,
      fleetOwnerId,
    );
    if (!drone) {
      throw new NotFoundException(`Drone ${dto.droneId} was not found.`);
    }

    if (drone.status !== DroneStatus.AVAILABLE) {
      throw new BadRequestException(
        `Drone ${dto.droneId} is not available for a new mission.`,
      );
    }

    if (plannedStart >= plannedEnd) {
      throw new BadRequestException(
        'Planned start must be before planned end.',
      );
    }

    const overlap = await this.missionsRepository.findOverlapping(
      dto.droneId,
      plannedStart,
      plannedEnd,
    );
    if (overlap) {
      void this.notificationsService
        .notifyScheduleConflictIfEnabled(
          fleetOwnerId,
          'This drone already has an overlapping active mission in the selected window.',
        )
        .catch(() => undefined);
      throw new ConflictException(
        'This drone already has a mission scheduled during this time window.',
      );
    }

    const mission = this.missionsRepository.create({
      ...dto,
      plannedStart,
      plannedEnd,
      status: MissionStatus.PLANNED,
    });

    return this.missionsRepository.save(mission);
  }
}

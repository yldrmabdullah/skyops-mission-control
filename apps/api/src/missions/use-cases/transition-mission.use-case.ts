import { Injectable } from '@nestjs/common';
import { IMissionsRepository } from '../repositories/missions.repository.interface';
import { WorkspaceContext } from '../../common/workspace-context/workspace-context';
import { NotificationsService } from '../../notifications/notifications.service';
import { TransitionMissionDto } from '../dto/transition-mission.dto';
import { MissionStatus } from '../entities/mission.entity';
import { DroneStatus } from '../../drones/entities/drone.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { resolveDroneStatusAfterMissionCompletion } from '../../drones/utils/drone-rules';
import { calculateNextMaintenanceDueDate } from '../../drones/utils/maintenance.utils';
import { MissionStateMachine } from '../utils/mission-transition.utils';
import {
  MissionAbortRequiresReasonException,
  MissionCompletionRequiresFlightHoursException,
  MissionNotFoundException,
  MissionStartDroneUnavailableException,
} from '../exceptions/mission-specific.exceptions';

@Injectable()
export class TransitionMissionUseCase {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly missionsRepository: IMissionsRepository,
    private readonly notificationsService: NotificationsService,
    private readonly workspaceContext: WorkspaceContext,
  ) {}

  async execute(id: string, dto: TransitionMissionDto) {
    const fleetOwnerId = this.workspaceContext.fleetOwnerId;

    const mission = await this.missionsRepository.findOne(id, fleetOwnerId);
    if (!mission) {
      throw new MissionNotFoundException(id);
    }

    MissionStateMachine.assertTransition(mission.status, dto.status);

    mission.status = dto.status;
    if (dto.status === MissionStatus.IN_PROGRESS) {
      if (mission.drone.status !== DroneStatus.AVAILABLE) {
        throw new MissionStartDroneUnavailableException(mission.drone.id);
      }
      mission.actualStart = new Date();
      mission.drone.status = DroneStatus.IN_MISSION;
    } else if (dto.status === MissionStatus.COMPLETED) {
      if (!dto.flightHoursLogged) {
        throw new MissionCompletionRequiresFlightHoursException();
      }
      mission.actualEnd = new Date();
      mission.flightHoursLogged = dto.flightHoursLogged;

      const totalFlightHours = Number(
        (
          (mission.drone.totalFlightHours || 0) + (dto.flightHoursLogged || 0)
        ).toFixed(1),
      );
      mission.drone.totalFlightHours = totalFlightHours;
      mission.drone.status = resolveDroneStatusAfterMissionCompletion(
        mission.drone,
      );

      mission.drone.nextMaintenanceDueDate = calculateNextMaintenanceDueDate(
        mission.drone.lastMaintenanceDate,
        mission.drone.totalFlightHours,
        mission.drone.flightHoursAtLastMaintenance,
      );

      void this.notificationsService
        .notifyMaintenanceDueStub(fleetOwnerId, mission.drone.serialNumber)
        .catch(() => undefined);
    } else if (dto.status === MissionStatus.ABORTED) {
      const abortReason = dto.abortReason?.trim();
      if (!abortReason) {
        throw new MissionAbortRequiresReasonException();
      }
      mission.abortReason = abortReason;
      mission.actualEnd = new Date();
      mission.drone.status = DroneStatus.AVAILABLE;
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.save(mission.drone);
      return manager.save(mission);
    });

    return mission;
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buildPaginationMeta } from '../common/utils/pagination';
import { Drone, DroneStatus } from '../drones/entities/drone.entity';
import { resolveDroneStatusAfterMissionCompletion } from '../drones/utils/drone-rules';
import { calculateNextMaintenanceDueDate } from '../drones/utils/maintenance.utils';
import { CreateMissionDto } from './dto/create-mission.dto';
import { ListMissionsQueryDto } from './dto/list-missions-query.dto';
import { TransitionMissionDto } from './dto/transition-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { Mission, MissionStatus } from './entities/mission.entity';
import { assertValidMissionTransition } from './utils/mission-transition.utils';

@Injectable()
export class MissionsService {
  constructor(
    @InjectRepository(Mission)
    private readonly missionsRepository: Repository<Mission>,
    @InjectRepository(Drone)
    private readonly dronesRepository: Repository<Drone>,
  ) {}

  async create(createMissionDto: CreateMissionDto, ownerId: string) {
    const plannedStart = new Date(createMissionDto.plannedStart);
    const plannedEnd = new Date(createMissionDto.plannedEnd);

    await this.getAvailableDroneOrThrow(createMissionDto.droneId, ownerId);
    this.assertValidPlannedWindow(plannedStart, plannedEnd);

    await this.assertNoOverlap(
      createMissionDto.droneId,
      plannedStart,
      plannedEnd,
    );

    const mission = this.missionsRepository.create({
      ...createMissionDto,
      plannedStart,
      plannedEnd,
      status: MissionStatus.PLANNED,
    });

    return this.missionsRepository.save(mission);
  }

  async findAll(query: ListMissionsQueryDto, ownerId: string) {
    const queryBuilder = this.missionsRepository
      .createQueryBuilder('mission')
      .leftJoinAndSelect('mission.drone', 'drone')
      .andWhere('drone.ownerId = :ownerId', { ownerId })
      .orderBy('mission.plannedStart', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    if (query.status) {
      queryBuilder.andWhere('mission.status = :status', {
        status: query.status,
      });
    }

    if (query.droneId) {
      queryBuilder.andWhere('mission.droneId = :droneId', {
        droneId: query.droneId,
      });
    }

    if (query.startDate) {
      queryBuilder.andWhere('mission.plannedStart >= :startDate', {
        startDate: new Date(query.startDate),
      });
    }

    if (query.endDate) {
      queryBuilder.andWhere('mission.plannedEnd <= :endDate', {
        endDate: new Date(query.endDate),
      });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string, ownerId: string) {
    const mission = await this.missionsRepository.findOne({
      where: { id },
      relations: { drone: true },
    });

    if (!mission) {
      throw new NotFoundException(`Mission ${id} was not found.`);
    }

    if (mission.drone.ownerId !== ownerId) {
      throw new NotFoundException(`Mission ${id} was not found.`);
    }

    return mission;
  }

  async update(
    id: string,
    updateMissionDto: UpdateMissionDto,
    ownerId: string,
  ) {
    const mission = await this.findOne(id, ownerId);

    if (mission.status !== MissionStatus.PLANNED) {
      throw new BadRequestException(
        'Only planned missions can be edited directly.',
      );
    }

    const plannedStart = updateMissionDto.plannedStart
      ? new Date(updateMissionDto.plannedStart)
      : mission.plannedStart;
    const plannedEnd = updateMissionDto.plannedEnd
      ? new Date(updateMissionDto.plannedEnd)
      : mission.plannedEnd;
    const droneId = updateMissionDto.droneId ?? mission.droneId;
    const isReassigningDrone = droneId !== mission.droneId;

    if (isReassigningDrone) {
      await this.getAvailableDroneOrThrow(droneId, ownerId);
    }

    this.assertValidPlannedWindow(plannedStart, plannedEnd);

    await this.assertNoOverlap(droneId, plannedStart, plannedEnd, mission.id);

    Object.assign(mission, {
      ...updateMissionDto,
      droneId,
      plannedStart,
      plannedEnd,
    });

    return this.missionsRepository.save(mission);
  }

  async transition(
    id: string,
    transitionMissionDto: TransitionMissionDto,
    ownerId: string,
  ) {
    const mission = await this.findOne(id, ownerId);
    const drone = await this.getDroneOrThrow(mission.droneId, ownerId);

    assertValidMissionTransition(mission.status, transitionMissionDto.status);

    if (transitionMissionDto.status === MissionStatus.ABORTED) {
      if (!transitionMissionDto.abortReason) {
        throw new BadRequestException('Aborting a mission requires a reason.');
      }

      mission.abortReason = transitionMissionDto.abortReason;
      mission.actualEnd = transitionMissionDto.actualEnd
        ? new Date(transitionMissionDto.actualEnd)
        : new Date();
      mission.status = MissionStatus.ABORTED;
      drone.status = DroneStatus.AVAILABLE;

      await this.dronesRepository.save(drone);
      return this.missionsRepository.save(mission);
    }

    if (transitionMissionDto.status === MissionStatus.IN_PROGRESS) {
      mission.actualStart = transitionMissionDto.actualStart
        ? new Date(transitionMissionDto.actualStart)
        : new Date();
      mission.status = MissionStatus.IN_PROGRESS;
      drone.status = DroneStatus.IN_MISSION;

      await this.dronesRepository.save(drone);
      return this.missionsRepository.save(mission);
    }

    if (transitionMissionDto.status === MissionStatus.COMPLETED) {
      if (!transitionMissionDto.flightHoursLogged) {
        throw new BadRequestException(
          'Completing a mission requires flight hours to be logged.',
        );
      }

      mission.flightHoursLogged = transitionMissionDto.flightHoursLogged;
      mission.actualEnd = transitionMissionDto.actualEnd
        ? new Date(transitionMissionDto.actualEnd)
        : new Date();
      mission.status = MissionStatus.COMPLETED;

      drone.totalFlightHours = Number(
        (
          drone.totalFlightHours + transitionMissionDto.flightHoursLogged
        ).toFixed(1),
      );
      drone.nextMaintenanceDueDate = calculateNextMaintenanceDueDate(
        drone.lastMaintenanceDate,
        drone.totalFlightHours,
        drone.flightHoursAtLastMaintenance,
      );
      drone.status = resolveDroneStatusAfterMissionCompletion(drone);

      await this.dronesRepository.save(drone);
      return this.missionsRepository.save(mission);
    }

    mission.status = transitionMissionDto.status;
    return this.missionsRepository.save(mission);
  }

  private assertValidPlannedWindow(plannedStart: Date, plannedEnd: Date) {
    if (plannedStart.getTime() < Date.now()) {
      throw new BadRequestException(
        'Missions cannot be scheduled in the past.',
      );
    }

    if (plannedStart.getTime() >= plannedEnd.getTime()) {
      throw new BadRequestException(
        'Mission planned end must be after planned start.',
      );
    }
  }

  private async getDroneOrThrow(droneId: string, ownerId: string) {
    const drone = await this.dronesRepository.findOne({
      where: { id: droneId, ownerId },
    });

    if (!drone) {
      throw new NotFoundException(`Drone ${droneId} was not found.`);
    }

    return drone;
  }

  private async getAvailableDroneOrThrow(droneId: string, ownerId: string) {
    const drone = await this.getDroneOrThrow(droneId, ownerId);

    if (drone.status !== DroneStatus.AVAILABLE) {
      throw new BadRequestException(
        'Only drones with AVAILABLE status can be assigned to missions.',
      );
    }

    return drone;
  }

  private async assertNoOverlap(
    droneId: string,
    plannedStart: Date,
    plannedEnd: Date,
    excludeMissionId?: string,
  ) {
    const overlappingMission = await this.missionsRepository
      .createQueryBuilder('mission')
      .where('mission.droneId = :droneId', { droneId })
      .andWhere('mission.status IN (:...schedulableStatuses)', {
        schedulableStatuses: [
          MissionStatus.PLANNED,
          MissionStatus.PRE_FLIGHT_CHECK,
          MissionStatus.IN_PROGRESS,
        ],
      })
      .andWhere('mission.plannedStart < :plannedEnd', { plannedEnd })
      .andWhere('mission.plannedEnd > :plannedStart', { plannedStart })
      .andWhere(excludeMissionId ? 'mission.id != :excludeMissionId' : '1=1', {
        excludeMissionId,
      })
      .getOne();

    if (overlappingMission) {
      throw new BadRequestException(
        'The selected drone already has an overlapping mission.',
      );
    }
  }
}

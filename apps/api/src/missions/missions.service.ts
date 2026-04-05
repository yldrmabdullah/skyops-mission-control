import { Injectable } from '@nestjs/common';
import { DomainException } from '../common/exceptions/domain.exception';
import {
  DroneNotAvailableException,
  MissionNotFoundException,
  MissionOverlapException,
} from './exceptions/mission-specific.exceptions';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  assertOrderedDateRangeOrThrow,
  parseIsoDateOrThrow,
} from '../common/utils/date.utils';
import { AuditService } from '../audit/audit.service';
import { buildPaginationMeta } from '../common/utils/pagination';
import { NotificationsService } from '../notifications/notifications.service';
import { Drone, DroneStatus } from '../drones/entities/drone.entity';
import { resolveDroneStatusAfterMissionCompletion } from '../drones/utils/drone-rules';
import { calculateNextMaintenanceDueDate } from '../drones/utils/maintenance.utils';
import { CreateMissionDto } from './dto/create-mission.dto';
import { ListMissionsQueryDto } from './dto/list-missions-query.dto';
import {
  MissionListSortField,
  MissionListSortOrder,
} from './dto/mission-list-sort.enum';
import { TransitionMissionDto } from './dto/transition-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { Mission, MissionStatus } from './entities/mission.entity';
import { assertValidMissionTransition } from './utils/mission-transition.utils';

function resolveMissionListOrder(query: ListMissionsQueryDto): {
  column: string;
  direction: 'ASC' | 'DESC';
} {
  const sortField = query.sortBy ?? MissionListSortField.PLANNED_START;
  const direction = query.sortOrder ?? MissionListSortOrder.ASC;
  return {
    column: `mission.${sortField}`,
    direction: direction as 'ASC' | 'DESC',
  };
}

@Injectable()
export class MissionsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Mission)
    private readonly missionsRepository: Repository<Mission>,
    @InjectRepository(Drone)
    private readonly dronesRepository: Repository<Drone>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    createMissionDto: CreateMissionDto,
    fleetOwnerId: string,
    actorUserId: string,
  ) {
    const plannedStart = parseIsoDateOrThrow(
      createMissionDto.plannedStart,
      'Planned start',
    );
    const plannedEnd = parseIsoDateOrThrow(
      createMissionDto.plannedEnd,
      'Planned end',
    );

    await this.getAvailableDroneOrThrow(createMissionDto.droneId, fleetOwnerId);
    this.assertValidPlannedWindow(plannedStart, plannedEnd);

    await this.assertNoOverlap(
      createMissionDto.droneId,
      plannedStart,
      plannedEnd,
      {
        ownerIdForNotify: fleetOwnerId,
      },
    );

    const mission = this.missionsRepository.create({
      ...createMissionDto,
      plannedStart,
      plannedEnd,
      status: MissionStatus.PLANNED,
    });

    const saved = await this.missionsRepository.save(mission);
    void this.auditService
      .record(actorUserId, 'MISSION_CREATED', 'Mission', saved.id, {
        name: saved.name,
        droneId: saved.droneId,
      })
      .catch(() => undefined);
    return saved;
  }

  async findAll(query: ListMissionsQueryDto, fleetOwnerId: string) {
    if (query.startDate && query.endDate) {
      assertOrderedDateRangeOrThrow(
        parseIsoDateOrThrow(query.startDate, 'startDate'),
        parseIsoDateOrThrow(query.endDate, 'endDate'),
        'startDate',
        'endDate',
      );
    }

    const queryBuilder = this.missionsRepository
      .createQueryBuilder('mission')
      .leftJoinAndSelect('mission.drone', 'drone')
      .andWhere('drone.ownerId = :fleetOwnerId', { fleetOwnerId });

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

    const term = query.search?.trim();
    if (term) {
      queryBuilder.andWhere(
        '(mission.name ILIKE :search OR mission.pilotName ILIKE :search)',
        { search: `%${term}%` },
      );
    }

    if (query.startDate) {
      queryBuilder.andWhere('mission.plannedStart >= :startDate', {
        startDate: parseIsoDateOrThrow(query.startDate, 'startDate'),
      });
    }

    if (query.endDate) {
      queryBuilder.andWhere('mission.plannedEnd <= :endDate', {
        endDate: parseIsoDateOrThrow(query.endDate, 'endDate'),
      });
    }

    const { column, direction } = resolveMissionListOrder(query);
    queryBuilder
      .orderBy(column, direction)
      .addOrderBy('mission.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string, fleetOwnerId: string) {
    const mission = await this.missionsRepository.findOne({
      where: { id, drone: { ownerId: fleetOwnerId } },
      relations: { drone: true },
    });

    if (!mission) {
      throw new MissionNotFoundException(id);
    }

    return mission;
  }

  async update(
    id: string,
    updateMissionDto: UpdateMissionDto,
    fleetOwnerId: string,
  ) {
    const mission = await this.findOne(id, fleetOwnerId);

    if (mission.status !== MissionStatus.PLANNED) {
      throw new DomainException(
        'Only planned missions can be edited directly.',
        'MISSION_STATUS_CONFLICT',
      );
    }

    const plannedStart = updateMissionDto.plannedStart
      ? parseIsoDateOrThrow(updateMissionDto.plannedStart, 'Planned start')
      : mission.plannedStart;
    const plannedEnd = updateMissionDto.plannedEnd
      ? parseIsoDateOrThrow(updateMissionDto.plannedEnd, 'Planned end')
      : mission.plannedEnd;

    const isDateChanging =
      plannedStart.getTime() !== mission.plannedStart.getTime() ||
      plannedEnd.getTime() !== mission.plannedEnd.getTime();

    const droneId = updateMissionDto.droneId ?? mission.droneId;
    const isReassigningDrone = droneId !== mission.droneId;

    if (isReassigningDrone) {
      await this.getAvailableDroneOrThrow(droneId, fleetOwnerId);
    }

    if (isDateChanging) {
      this.assertValidPlannedWindow(plannedStart, plannedEnd);
    }

    await this.assertNoOverlap(droneId, plannedStart, plannedEnd, {
      excludeMissionId: mission.id,
      ownerIdForNotify: fleetOwnerId,
    });

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
    fleetOwnerId: string,
    actorUserId: string,
  ) {
    const mission = await this.findOne(id, fleetOwnerId);
    const drone = await this.getDroneOrThrow(mission.droneId, fleetOwnerId);

    if (mission.status === transitionMissionDto.status) {
      throw new DomainException(
        `Mission is already ${mission.status}.`,
        'MISSION_STATUS_CONFLICT',
      );
    }

    assertValidMissionTransition(mission.status, transitionMissionDto.status);

    const prevStatus = mission.status;

    switch (transitionMissionDto.status) {
      case MissionStatus.ABORTED:
        return this.persistAbortedMission(
          mission,
          drone,
          transitionMissionDto,
          actorUserId,
          prevStatus,
        );
      case MissionStatus.IN_PROGRESS:
        return this.persistInProgressMission(
          mission,
          drone,
          transitionMissionDto,
          actorUserId,
        );
      case MissionStatus.COMPLETED:
        return this.persistCompletedMission(
          mission,
          drone,
          transitionMissionDto,
          fleetOwnerId,
          actorUserId,
        );
      default:
        return this.persistGenericMissionTransition(
          mission,
          transitionMissionDto.status,
          actorUserId,
          prevStatus,
        );
    }
  }

  private async persistAbortedMission(
    mission: Mission,
    drone: Drone,
    dto: TransitionMissionDto,
    actorUserId: string,
    prevStatus: MissionStatus,
  ): Promise<Mission> {
    const abortReason = dto.abortReason?.trim();
    if (!abortReason) {
      throw new DomainException(
        'Aborting a mission requires a reason.',
        'MISSING_REQUIRED_FIELD',
      );
    }

    mission.abortReason = abortReason;
    mission.actualEnd = dto.actualEnd
      ? parseIsoDateOrThrow(dto.actualEnd, 'Actual end')
      : new Date();

    if (mission.actualStart) {
      assertOrderedDateRangeOrThrow(
        mission.actualStart,
        mission.actualEnd,
        'Actual start',
        'Actual end',
      );
    }

    mission.status = MissionStatus.ABORTED;
    drone.status = DroneStatus.AVAILABLE;

    const saved = await this.dataSource.transaction(async (manager) => {
      await manager.save(drone);
      return manager.save(mission);
    });
    void this.auditService
      .record(actorUserId, 'MISSION_ABORTED', 'Mission', saved.id, {
        from: prevStatus,
      })
      .catch(() => undefined);
    return saved;
  }

  private async persistInProgressMission(
    mission: Mission,
    drone: Drone,
    dto: TransitionMissionDto,
    actorUserId: string,
  ): Promise<Mission> {
    if (drone.status !== DroneStatus.AVAILABLE) {
      throw new DroneNotAvailableException(drone.id, drone.status);
    }

    mission.actualStart = dto.actualStart
      ? parseIsoDateOrThrow(dto.actualStart, 'Actual start')
      : new Date();
    mission.status = MissionStatus.IN_PROGRESS;
    drone.status = DroneStatus.IN_MISSION;

    const saved = await this.dataSource.transaction(async (manager) => {
      await manager.save(drone);
      return manager.save(mission);
    });
    void this.auditService
      .record(actorUserId, 'MISSION_IN_PROGRESS', 'Mission', saved.id, {})
      .catch(() => undefined);
    return saved;
  }

  private async persistCompletedMission(
    mission: Mission,
    drone: Drone,
    dto: TransitionMissionDto,
    fleetOwnerId: string,
    actorUserId: string,
  ): Promise<Mission> {
    if (!dto.flightHoursLogged) {
      throw new DomainException(
        'Completing a mission requires flight hours to be logged.',
        'MISSING_REQUIRED_FIELD',
      );
    }

    mission.flightHoursLogged = dto.flightHoursLogged;
    mission.actualEnd = dto.actualEnd
      ? parseIsoDateOrThrow(dto.actualEnd, 'Actual end')
      : new Date();

    if (mission.actualStart) {
      assertOrderedDateRangeOrThrow(
        mission.actualStart,
        mission.actualEnd,
        'Actual start',
        'Actual end',
      );
    }

    mission.status = MissionStatus.COMPLETED;

    drone.totalFlightHours = Number(
      (drone.totalFlightHours + dto.flightHoursLogged).toFixed(1),
    );
    drone.nextMaintenanceDueDate = calculateNextMaintenanceDueDate(
      drone.lastMaintenanceDate,
      drone.totalFlightHours,
      drone.flightHoursAtLastMaintenance,
    );
    drone.status = resolveDroneStatusAfterMissionCompletion(drone);

    const saved = await this.dataSource.transaction(async (manager) => {
      await manager.save(drone);
      return manager.save(mission);
    });
    void this.auditService
      .record(actorUserId, 'MISSION_COMPLETED', 'Mission', saved.id, {
        flightHoursLogged: dto.flightHoursLogged,
      })
      .catch(() => undefined);
    void this.notificationsService
      .notifyMaintenanceDueStub(fleetOwnerId, drone.serialNumber)
      .catch(() => undefined);
    return saved;
  }

  private async persistGenericMissionTransition(
    mission: Mission,
    nextStatus: MissionStatus,
    actorUserId: string,
    prevStatus: MissionStatus,
  ): Promise<Mission> {
    mission.status = nextStatus;
    const saved = await this.missionsRepository.save(mission);
    void this.auditService
      .record(actorUserId, 'MISSION_TRANSITION', 'Mission', saved.id, {
        from: prevStatus,
        to: nextStatus,
      })
      .catch(() => undefined);
    return saved;
  }

  private assertValidPlannedWindow(plannedStart: Date, plannedEnd: Date) {
    if (plannedStart.getTime() < Date.now()) {
      throw new DomainException(
        'Missions cannot be scheduled in the past.',
        'INVALID_MISSION_WINDOW',
      );
    }

    if (plannedStart.getTime() >= plannedEnd.getTime()) {
      throw new DomainException(
        'Mission planned end must be after planned start.',
        'INVALID_MISSION_WINDOW',
      );
    }
  }

  private async getDroneOrThrow(droneId: string, ownerId: string) {
    const drone = await this.dronesRepository.findOne({
      where: { id: droneId, ownerId },
    });

    if (!drone) {
      throw new DomainException(
        `Drone ${droneId} was not found.`,
        'DRONE_NOT_FOUND',
        404,
      );
    }

    return drone;
  }

  private async getAvailableDroneOrThrow(droneId: string, ownerId: string) {
    const drone = await this.getDroneOrThrow(droneId, ownerId);

    if (drone.status !== DroneStatus.AVAILABLE) {
      throw new DroneNotAvailableException(drone.id, drone.status);
    }

    return drone;
  }

  private async assertNoOverlap(
    droneId: string,
    plannedStart: Date,
    plannedEnd: Date,
    options?: { excludeMissionId?: string; ownerIdForNotify?: string },
  ) {
    const overlapQuery = this.missionsRepository
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
      .andWhere('mission.plannedEnd > :plannedStart', { plannedStart });

    if (options?.excludeMissionId) {
      overlapQuery.andWhere('mission.id != :excludeMissionId', {
        excludeMissionId: options.excludeMissionId,
      });
    }

    const overlappingMission = await overlapQuery.getOne();

    if (overlappingMission) {
      if (options?.ownerIdForNotify) {
        void this.notificationsService
          .notifyScheduleConflictIfEnabled(
            options.ownerIdForNotify,
            'This drone already has an overlapping active mission in the selected window.',
          )
          .catch(() => undefined);
      }
      throw new MissionOverlapException(droneId, plannedStart, plannedEnd);
    }
  }
}

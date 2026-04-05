import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsOrder,
  FindOptionsWhere,
  ILike,
  In,
  Not,
  Repository,
} from 'typeorm';
import { parseIsoDateOrThrow } from '../common/utils/date.utils';
import { AuditService } from '../audit/audit.service';
import { OperatorRole } from '../auth/operator-role.enum';
import { buildPaginationMeta } from '../common/utils/pagination';
import { MaintenanceLog } from '../maintenance/entities/maintenance-log.entity';
import { Mission, MissionStatus } from '../missions/entities/mission.entity';
import { CreateDroneDto } from './dto/create-drone.dto';
import {
  DroneListSortField,
  DroneListSortOrder,
} from './dto/drone-list-sort.enum';
import { ListDronesQueryDto } from './dto/list-drones-query.dto';
import { UpdateDroneDto } from './dto/update-drone.dto';
import { Drone, DroneStatus } from './entities/drone.entity';
import {
  calculateNextMaintenanceDueDate,
  isMaintenanceDue,
  isMaintenanceWatchlistCandidate,
} from './utils/maintenance.utils';
import {
  assertDroneCanBeDeleted,
  assertDroneCanBeRetired,
  assertValidFlightHoursSnapshot,
} from './utils/drone-rules';

function resolveDroneListOrder(
  query: ListDronesQueryDto,
): FindOptionsOrder<Drone> {
  const field = query.sortBy ?? DroneListSortField.REGISTERED_AT;
  const direction =
    query.sortOrder ??
    (field === DroneListSortField.REGISTERED_AT
      ? DroneListSortOrder.DESC
      : DroneListSortOrder.ASC);
  return { [field]: direction };
}

@Injectable()
export class DronesService {
  constructor(
    @InjectRepository(Drone)
    private readonly dronesRepository: Repository<Drone>,
    @InjectRepository(Mission)
    private readonly missionsRepository: Repository<Mission>,
    @InjectRepository(MaintenanceLog)
    private readonly maintenanceLogsRepository: Repository<MaintenanceLog>,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createDroneDto: CreateDroneDto,
    fleetOwnerId: string,
    actorUserId: string,
  ) {
    const existingDrone = await this.dronesRepository.findOne({
      where: {
        serialNumber: createDroneDto.serialNumber,
        ownerId: fleetOwnerId,
      },
    });

    if (existingDrone) {
      throw new ConflictException(
        'A drone with this serial number already exists.',
      );
    }

    const lastMaintenanceDate = parseIsoDateOrThrow(
      createDroneDto.lastMaintenanceDate,
      'Last maintenance date',
    );
    const totalFlightHours = createDroneDto.totalFlightHours ?? 0;
    const flightHoursAtLastMaintenance =
      createDroneDto.flightHoursAtLastMaintenance ?? totalFlightHours;

    assertValidFlightHoursSnapshot(
      totalFlightHours,
      flightHoursAtLastMaintenance,
    );

    const drone = this.dronesRepository.create({
      ownerId: fleetOwnerId,
      serialNumber: createDroneDto.serialNumber,
      model: createDroneDto.model,
      status: createDroneDto.status ?? DroneStatus.AVAILABLE,
      totalFlightHours,
      flightHoursAtLastMaintenance,
      lastMaintenanceDate,
      nextMaintenanceDueDate: calculateNextMaintenanceDueDate(
        lastMaintenanceDate,
        totalFlightHours,
        flightHoursAtLastMaintenance,
      ),
    });

    const saved = await this.dronesRepository.save(drone);
    void this.auditService
      .record(actorUserId, 'DRONE_CREATED', 'Drone', saved.id, {
        serialNumber: saved.serialNumber,
      })
      .catch(() => undefined);
    return saved;
  }

  async findAll(query: ListDronesQueryDto, fleetOwnerId: string) {
    const where: FindOptionsWhere<Drone> = { ownerId: fleetOwnerId };

    if (query.status) {
      where.status = query.status;
    }

    const term = query.search?.trim();
    if (term) {
      where.serialNumber = ILike(`%${term}%`);
    }

    const [rows, total] = await this.dronesRepository.findAndCount({
      where,
      order: resolveDroneListOrder(query),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    const data = rows.map((drone) => ({
      ...drone,
      maintenanceDue: isMaintenanceDue({
        totalFlightHours: drone.totalFlightHours,
        flightHoursAtLastMaintenance: drone.flightHoursAtLastMaintenance,
        nextMaintenanceDueDate: drone.nextMaintenanceDueDate,
      }),
      maintenanceWatchlist: isMaintenanceWatchlistCandidate({
        totalFlightHours: drone.totalFlightHours,
        flightHoursAtLastMaintenance: drone.flightHoursAtLastMaintenance,
        nextMaintenanceDueDate: drone.nextMaintenanceDueDate,
      }),
    }));

    return {
      data,
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(
    id: string,
    fleetOwnerId: string,
    viewerRole: OperatorRole = OperatorRole.PILOT,
  ) {
    const drone = await this.dronesRepository.findOne({
      where: { id, ownerId: fleetOwnerId },
      relations: {
        missions: true,
        maintenanceLogs: true,
      },
      order: {
        missions: { plannedStart: 'DESC' },
        maintenanceLogs: { performedAt: 'DESC' },
      },
    });

    if (!drone) {
      throw new NotFoundException(`Drone ${id} was not found.`);
    }

    const maintenanceLogs =
      viewerRole === OperatorRole.PILOT ? [] : (drone.maintenanceLogs ?? []);

    return {
      ...drone,
      maintenanceLogs,
      maintenanceDue: isMaintenanceDue({
        totalFlightHours: drone.totalFlightHours,
        flightHoursAtLastMaintenance: drone.flightHoursAtLastMaintenance,
        nextMaintenanceDueDate: drone.nextMaintenanceDueDate,
      }),
    };
  }

  async update(
    id: string,
    updateDroneDto: UpdateDroneDto,
    fleetOwnerId: string,
    actorUserId: string,
  ) {
    const drone = await this.dronesRepository.findOne({
      where: { id, ownerId: fleetOwnerId },
    });

    if (!drone) {
      throw new NotFoundException(`Drone ${id} was not found.`);
    }

    await this.assertSerialNumberAvailableForUpdate(
      id,
      fleetOwnerId,
      drone.serialNumber,
      updateDroneDto.serialNumber,
    );
    await this.assertRetiredAllowedIfRequested(id, updateDroneDto.status);

    const lastMaintenanceDate = updateDroneDto.lastMaintenanceDate
      ? parseIsoDateOrThrow(
          updateDroneDto.lastMaintenanceDate,
          'Last maintenance date',
        )
      : drone.lastMaintenanceDate;
    const totalFlightHours =
      updateDroneDto.totalFlightHours ?? drone.totalFlightHours;
    const flightHoursAtLastMaintenance =
      updateDroneDto.flightHoursAtLastMaintenance ??
      drone.flightHoursAtLastMaintenance;

    assertValidFlightHoursSnapshot(
      totalFlightHours,
      flightHoursAtLastMaintenance,
    );

    this.applyDroneUpdateFields(drone, updateDroneDto, {
      lastMaintenanceDate,
      totalFlightHours,
      flightHoursAtLastMaintenance,
    });

    if (
      updateDroneDto.status === DroneStatus.AVAILABLE &&
      isMaintenanceDue(drone)
    ) {
      throw new BadRequestException(
        'Drone cannot be set to AVAILABLE because maintenance is overdue. Please log a maintenance completion instead.',
      );
    }

    const saved = await this.dronesRepository.save(drone);
    void this.auditService
      .record(actorUserId, 'DRONE_UPDATED', 'Drone', saved.id, {})
      .catch(() => undefined);
    return saved;
  }

  async remove(id: string, fleetOwnerId: string, actorUserId: string) {
    const drone = await this.dronesRepository.findOne({
      where: { id, ownerId: fleetOwnerId },
    });

    if (!drone) {
      throw new NotFoundException(`Drone ${id} was not found.`);
    }

    const relatedMissionCount = await this.missionsRepository.count({
      where: { droneId: id },
    });
    const relatedMaintenanceLogCount =
      await this.maintenanceLogsRepository.count({
        where: { droneId: id },
      });

    assertDroneCanBeDeleted(relatedMissionCount, relatedMaintenanceLogCount);

    await this.dronesRepository.remove(drone);
    void this.auditService
      .record(actorUserId, 'DRONE_DELETED', 'Drone', id, {
        serialNumber: drone.serialNumber,
      })
      .catch(() => undefined);

    return { success: true };
  }

  private async assertSerialNumberAvailableForUpdate(
    droneId: string,
    ownerId: string,
    currentSerial: string,
    nextSerial: string | undefined,
  ) {
    if (!nextSerial || nextSerial === currentSerial) {
      return;
    }

    const existingDrone = await this.dronesRepository.findOne({
      where: {
        serialNumber: nextSerial,
        ownerId,
        id: Not(droneId),
      },
    });

    if (existingDrone) {
      throw new ConflictException(
        'A drone with this serial number already exists.',
      );
    }
  }

  private async assertRetiredAllowedIfRequested(
    droneId: string,
    nextStatus: DroneStatus | undefined,
  ) {
    if (nextStatus !== DroneStatus.RETIRED) {
      return;
    }

    const activeMission = await this.missionsRepository.findOne({
      where: {
        droneId,
        status: In([
          MissionStatus.PLANNED,
          MissionStatus.PRE_FLIGHT_CHECK,
          MissionStatus.IN_PROGRESS,
        ]),
      },
      order: { plannedStart: 'ASC' },
    });

    assertDroneCanBeRetired(activeMission);
  }

  private applyDroneUpdateFields(
    drone: Drone,
    updateDroneDto: UpdateDroneDto,
    resolved: {
      lastMaintenanceDate: Date;
      totalFlightHours: number;
      flightHoursAtLastMaintenance: number;
    },
  ) {
    Object.assign(drone, {
      serialNumber: updateDroneDto.serialNumber ?? drone.serialNumber,
      model: updateDroneDto.model ?? drone.model,
      status: updateDroneDto.status ?? drone.status,
      totalFlightHours: resolved.totalFlightHours,
      flightHoursAtLastMaintenance: resolved.flightHoursAtLastMaintenance,
      lastMaintenanceDate: resolved.lastMaintenanceDate,
      nextMaintenanceDueDate: calculateNextMaintenanceDueDate(
        resolved.lastMaintenanceDate,
        resolved.totalFlightHours,
        resolved.flightHoursAtLastMaintenance,
      ),
    });
  }
}

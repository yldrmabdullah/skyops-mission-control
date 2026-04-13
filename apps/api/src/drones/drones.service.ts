import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Audit } from '../common/audit/audit.decorator';
import { WorkspaceContext } from '../common/workspace-context/workspace-context';
import { IDronesRepository } from './repositories/drones.repository.interface';
import { IMissionsRepository } from '../missions/repositories/missions.repository.interface';
import { IMaintenanceLogsRepository } from '../maintenance/repositories/maintenance-logs.repository.interface';
import { parseIsoDateOrThrow } from '../common/utils/date.utils';
import { AuditService } from '../audit/audit.service';
import { OperatorRole } from '../auth/operator-role.enum';
import { buildPaginationMeta } from '../common/utils/pagination';
import { CreateDroneDto } from './dto/create-drone.dto';
import {
  DroneListSortField,
  DroneListSortOrder,
} from './dto/drone-list-sort.enum';
import { ListDronesQueryDto } from './dto/list-drones-query.dto';
import { UpdateDroneDto } from './dto/update-drone.dto';
import { Drone, DroneStatus } from './entities/drone.entity';
import { calculateNextMaintenanceDueDate } from './utils/maintenance.utils';
import {
  assertDroneCanBeDeleted,
  assertDroneCanBeRetired,
  assertValidFlightHoursSnapshot,
} from './utils/drone-rules';

function resolveDroneListOrder(query: ListDronesQueryDto) {
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
    private readonly dronesRepository: IDronesRepository,
    private readonly missionsRepository: IMissionsRepository,
    private readonly maintenanceLogsRepository: IMaintenanceLogsRepository,
    private readonly auditService: AuditService,
    private readonly workspaceContext: WorkspaceContext,
  ) {}

  @Audit({ action: 'DRONE_REGISTERED', entityType: 'Drone' })
  async create(createDroneDto: CreateDroneDto) {
    const fleetOwnerId = this.workspaceContext.fleetOwnerId;
    const existingDrone = await this.dronesRepository.findBySerialNumber(
      createDroneDto.serialNumber,
      fleetOwnerId,
    );

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

    const drone = {
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
    } as Drone;

    const saved = await this.dronesRepository.save(drone);
    return saved;
  }

  async findAll(query: ListDronesQueryDto) {
    const fleetOwnerId = this.workspaceContext.fleetOwnerId;
    const [rows, total] = await this.dronesRepository.findAll(fleetOwnerId, {
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      status: query.status,
      model: query.model,
      order: resolveDroneListOrder(query),
      search: query.search,
    });

    const data = rows.map((drone) => ({
      ...drone,
      maintenanceDue: drone.isMaintenanceDue(),
      maintenanceWatchlist: drone.isMaintenanceWatchlistCandidate(),
    }));

    return {
      data,
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string, viewerRole: OperatorRole = OperatorRole.PILOT) {
    const fleetOwnerId = this.workspaceContext.fleetOwnerId;
    const drone = await this.dronesRepository.findOne(id, fleetOwnerId);

    if (!drone) {
      throw new NotFoundException(`Drone ${id} was not found.`);
    }

    const maintenanceLogs =
      viewerRole === OperatorRole.PILOT ? [] : (drone.maintenanceLogs ?? []);

    return {
      ...drone,
      maintenanceLogs,
      maintenanceDue: drone.isMaintenanceDue(),
    };
  }

  @Audit({ action: 'DRONE_UPDATED', entityType: 'Drone' })
  async update(id: string, updateDroneDto: UpdateDroneDto) {
    const fleetOwnerId = this.workspaceContext.fleetOwnerId;
    const drone = await this.dronesRepository.findOne(id, fleetOwnerId);

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
      drone.isMaintenanceDue()
    ) {
      throw new BadRequestException(
        'Drone cannot be set to AVAILABLE because maintenance is overdue. Please log a maintenance completion instead.',
      );
    }

    const saved = await this.dronesRepository.save(drone);
    return saved;
  }

  @Audit({ action: 'DRONE_REMOVED', entityType: 'Drone' })
  async remove(id: string) {
    const fleetOwnerId = this.workspaceContext.fleetOwnerId;
    const drone = await this.dronesRepository.findOne(id, fleetOwnerId);

    if (!drone) {
      throw new NotFoundException(`Drone ${id} was not found.`);
    }

    const relatedMissionCount =
      await this.missionsRepository.countByDroneId(id);
    const relatedMaintenanceLogCount =
      await this.maintenanceLogsRepository.countByDroneId(id);

    assertDroneCanBeDeleted(relatedMissionCount, relatedMaintenanceLogCount);

    await this.dronesRepository.remove(drone);
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

    const existingDrone = await this.dronesRepository.findBySerialNumber(
      nextSerial,
      ownerId,
    );

    if (existingDrone && existingDrone.id !== droneId) {
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

    const activeMission =
      await this.missionsRepository.findActiveOnDrone(droneId);

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

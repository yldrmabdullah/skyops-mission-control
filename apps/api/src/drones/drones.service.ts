import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Not, Repository } from 'typeorm';
import { parseIsoDateOrThrow } from '../common/utils/date.utils';
import { buildPaginationMeta } from '../common/utils/pagination';
import { MaintenanceLog } from '../maintenance/entities/maintenance-log.entity';
import { Mission, MissionStatus } from '../missions/entities/mission.entity';
import { CreateDroneDto } from './dto/create-drone.dto';
import { ListDronesQueryDto } from './dto/list-drones-query.dto';
import { UpdateDroneDto } from './dto/update-drone.dto';
import { Drone, DroneStatus } from './entities/drone.entity';
import {
  calculateNextMaintenanceDueDate,
  isMaintenanceDue,
} from './utils/maintenance.utils';
import {
  assertDroneCanBeDeleted,
  assertDroneCanBeRetired,
  assertValidFlightHoursSnapshot,
} from './utils/drone-rules';

@Injectable()
export class DronesService {
  constructor(
    @InjectRepository(Drone)
    private readonly dronesRepository: Repository<Drone>,
    @InjectRepository(Mission)
    private readonly missionsRepository: Repository<Mission>,
    @InjectRepository(MaintenanceLog)
    private readonly maintenanceLogsRepository: Repository<MaintenanceLog>,
  ) {}

  async create(createDroneDto: CreateDroneDto, ownerId: string) {
    const existingDrone = await this.dronesRepository.findOne({
      where: { serialNumber: createDroneDto.serialNumber, ownerId },
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
      ownerId,
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

    return this.dronesRepository.save(drone);
  }

  async findAll(query: ListDronesQueryDto, ownerId: string) {
    const where: FindOptionsWhere<Drone> = { ownerId };

    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await this.dronesRepository.findAndCount({
      where,
      order: { registeredAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      data,
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string, ownerId: string) {
    const drone = await this.dronesRepository.findOne({
      where: { id, ownerId },
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

    return {
      ...drone,
      maintenanceDue: isMaintenanceDue({
        totalFlightHours: drone.totalFlightHours,
        flightHoursAtLastMaintenance: drone.flightHoursAtLastMaintenance,
        nextMaintenanceDueDate: drone.nextMaintenanceDueDate,
      }),
    };
  }

  async update(id: string, updateDroneDto: UpdateDroneDto, ownerId: string) {
    const drone = await this.dronesRepository.findOne({
      where: { id, ownerId },
    });

    if (!drone) {
      throw new NotFoundException(`Drone ${id} was not found.`);
    }

    if (
      updateDroneDto.serialNumber &&
      updateDroneDto.serialNumber !== drone.serialNumber
    ) {
      const existingDrone = await this.dronesRepository.findOne({
        where: {
          serialNumber: updateDroneDto.serialNumber,
          ownerId,
          id: Not(id),
        },
      });

      if (existingDrone) {
        throw new ConflictException(
          'A drone with this serial number already exists.',
        );
      }
    }

    if (updateDroneDto.status === DroneStatus.RETIRED) {
      const activeMission = await this.missionsRepository.findOne({
        where: {
          droneId: id,
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

    Object.assign(drone, {
      serialNumber: updateDroneDto.serialNumber ?? drone.serialNumber,
      model: updateDroneDto.model ?? drone.model,
      status: updateDroneDto.status ?? drone.status,
      totalFlightHours,
      flightHoursAtLastMaintenance,
      lastMaintenanceDate,
      nextMaintenanceDueDate: calculateNextMaintenanceDueDate(
        lastMaintenanceDate,
        totalFlightHours,
        flightHoursAtLastMaintenance,
      ),
    });

    return this.dronesRepository.save(drone);
  }

  async remove(id: string, ownerId: string) {
    const drone = await this.dronesRepository.findOne({
      where: { id, ownerId },
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

    return { success: true };
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Drone, DroneStatus } from '../drones/entities/drone.entity';
import { calculateNextMaintenanceDueDate } from '../drones/utils/maintenance.utils';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { ListMaintenanceLogsQueryDto } from './dto/list-maintenance-logs-query.dto';
import { MaintenanceLog } from './entities/maintenance-log.entity';

const FLIGHT_HOUR_TOLERANCE = 2;

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceLog)
    private readonly maintenanceLogsRepository: Repository<MaintenanceLog>,
    @InjectRepository(Drone)
    private readonly dronesRepository: Repository<Drone>,
  ) {}

  async create(createMaintenanceLogDto: CreateMaintenanceLogDto) {
    const drone = await this.dronesRepository.findOne({
      where: { id: createMaintenanceLogDto.droneId },
    });

    if (!drone) {
      throw new NotFoundException(
        `Drone ${createMaintenanceLogDto.droneId} was not found.`,
      );
    }

    if (drone.status === DroneStatus.IN_MISSION) {
      throw new BadRequestException(
        'A drone currently in mission cannot receive a maintenance log.',
      );
    }

    if (
      Math.abs(
        drone.totalFlightHours -
          createMaintenanceLogDto.flightHoursAtMaintenance,
      ) > FLIGHT_HOUR_TOLERANCE
    ) {
      throw new BadRequestException(
        'Recorded flight hours at maintenance must be consistent with the drone total flight hours.',
      );
    }

    const performedAt = new Date(createMaintenanceLogDto.performedAt);

    const maintenanceLog = this.maintenanceLogsRepository.create({
      ...createMaintenanceLogDto,
      performedAt,
      notes: createMaintenanceLogDto.notes ?? null,
    });

    drone.lastMaintenanceDate = performedAt;
    drone.flightHoursAtLastMaintenance =
      createMaintenanceLogDto.flightHoursAtMaintenance;
    drone.nextMaintenanceDueDate = calculateNextMaintenanceDueDate(performedAt);
    drone.status =
      drone.status === DroneStatus.RETIRED
        ? DroneStatus.RETIRED
        : DroneStatus.AVAILABLE;

    await this.dronesRepository.save(drone);

    return this.maintenanceLogsRepository.save(maintenanceLog);
  }

  async findAll(query: ListMaintenanceLogsQueryDto) {
    const queryBuilder = this.maintenanceLogsRepository
      .createQueryBuilder('maintenanceLog')
      .leftJoinAndSelect('maintenanceLog.drone', 'drone')
      .orderBy('maintenanceLog.performedAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    if (query.droneId) {
      queryBuilder.andWhere('maintenanceLog.droneId = :droneId', {
        droneId: query.droneId,
      });
    }

    if (query.startDate) {
      queryBuilder.andWhere('maintenanceLog.performedAt >= :startDate', {
        startDate: new Date(query.startDate),
      });
    }

    if (query.endDate) {
      queryBuilder.andWhere('maintenanceLog.performedAt <= :endDate', {
        endDate: new Date(query.endDate),
      });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}

import { createReadStream } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { basename, extname, join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import {
  assertOrderedDateRangeOrThrow,
  parseIsoDateOrThrow,
} from '../common/utils/date.utils';
import { buildPaginationMeta } from '../common/utils/pagination';
import { Drone, DroneStatus } from '../drones/entities/drone.entity';
import { calculateNextMaintenanceDueDate } from '../drones/utils/maintenance.utils';
import { resolveDroneStatusAfterMaintenance } from '../drones/utils/drone-rules';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { ListMaintenanceLogsQueryDto } from './dto/list-maintenance-logs-query.dto';
import {
  MaintenanceLog,
  type MaintenanceAttachment,
} from './entities/maintenance-log.entity';

const FLIGHT_HOUR_TOLERANCE = 2;
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'maintenance');

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(MaintenanceLog)
    private readonly maintenanceLogsRepository: Repository<MaintenanceLog>,
    @InjectRepository(Drone)
    private readonly dronesRepository: Repository<Drone>,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createMaintenanceLogDto: CreateMaintenanceLogDto,
    fleetOwnerId: string,
    actorUserId: string,
  ) {
    const drone = await this.dronesRepository.findOne({
      where: { id: createMaintenanceLogDto.droneId, ownerId: fleetOwnerId },
    });

    if (!drone) {
      throw new NotFoundException(
        `Drone ${createMaintenanceLogDto.droneId} was not found.`,
      );
    }

    MaintenanceService.assertCreatePreconditions(
      drone,
      createMaintenanceLogDto,
    );

    const performedAt = parseIsoDateOrThrow(
      createMaintenanceLogDto.performedAt,
      'Performed at',
    );

    const { attachmentUrls, ...rest } = createMaintenanceLogDto;
    const urlAttachments: MaintenanceAttachment[] = (attachmentUrls ?? []).map(
      (url) => ({ type: 'url', url }),
    );

    const maintenanceLog = this.maintenanceLogsRepository.create({
      ...rest,
      performedAt,
      notes: createMaintenanceLogDto.notes ?? null,
      attachments: urlAttachments,
    });

    drone.lastMaintenanceDate = performedAt;
    drone.flightHoursAtLastMaintenance =
      createMaintenanceLogDto.flightHoursAtMaintenance;
    drone.nextMaintenanceDueDate = calculateNextMaintenanceDueDate(
      performedAt,
      drone.totalFlightHours,
      drone.flightHoursAtLastMaintenance,
    );
    drone.status = resolveDroneStatusAfterMaintenance(drone.status);

    const saved = await this.dataSource.transaction(async (manager) => {
      await manager.save(drone);
      return manager.save(maintenanceLog);
    });

    void this.auditService
      .record(actorUserId, 'MAINTENANCE_CREATED', 'MaintenanceLog', saved.id, {
        droneId: saved.droneId,
      })
      .catch(() => undefined);
    return saved;
  }

  private static assertCreatePreconditions(
    drone: Drone,
    dto: CreateMaintenanceLogDto,
  ) {
    if (drone.status === DroneStatus.IN_MISSION) {
      throw new BadRequestException(
        'A drone currently in mission cannot receive a maintenance log.',
      );
    }

    if (
      Math.abs(drone.totalFlightHours - dto.flightHoursAtMaintenance) >
      FLIGHT_HOUR_TOLERANCE
    ) {
      throw new BadRequestException(
        'Recorded flight hours at maintenance must be consistent with the drone total flight hours.',
      );
    }
  }

  async addFileAttachment(
    fleetOwnerId: string,
    logId: string,
    file: Express.Multer.File,
  ) {
    const log = await this.maintenanceLogsRepository.findOne({
      where: { id: logId },
      relations: { drone: true },
    });

    if (!log || log.drone.ownerId !== fleetOwnerId) {
      throw new NotFoundException(`Maintenance log ${logId} was not found.`);
    }

    const ext = extname(file.originalname).slice(0, 20) || '';
    const storedFileName = `${randomUUID()}${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(join(UPLOAD_DIR, storedFileName), file.buffer);

    const next: MaintenanceAttachment = {
      type: 'file',
      storedFileName,
      originalName: file.originalname.slice(0, 255),
      mimeType: file.mimetype.slice(0, 120),
    };

    log.attachments = [...(log.attachments ?? []), next];
    return this.maintenanceLogsRepository.save(log);
  }

  private static readonly STORED_FILE_NAME_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(\.[^./\\]+)?$/i;

  async getAttachmentFile(
    fleetOwnerId: string,
    logId: string,
    rawFileName: string,
  ): Promise<StreamableFile> {
    const storedFileName = basename(rawFileName);
    if (
      storedFileName !== rawFileName ||
      !MaintenanceService.STORED_FILE_NAME_REGEX.test(storedFileName)
    ) {
      throw new BadRequestException('Invalid attachment file name.');
    }

    const log = await this.maintenanceLogsRepository.findOne({
      where: { id: logId },
      relations: { drone: true },
    });

    if (!log || log.drone.ownerId !== fleetOwnerId) {
      throw new NotFoundException(`Maintenance log ${logId} was not found.`);
    }

    const attachments = log.attachments ?? [];
    const meta = attachments.find(
      (a): a is Extract<MaintenanceAttachment, { type: 'file' }> =>
        a.type === 'file' && a.storedFileName === storedFileName,
    );

    if (!meta) {
      throw new NotFoundException('Attachment was not found.');
    }

    const absolutePath = join(UPLOAD_DIR, storedFileName);
    const stream = createReadStream(absolutePath);
    const mime = meta.mimeType || 'application/octet-stream';

    return new StreamableFile(stream, {
      type: mime,
      disposition: `attachment; filename="${encodeURIComponent(meta.originalName)}"`,
    });
  }

  async findAll(query: ListMaintenanceLogsQueryDto, fleetOwnerId: string) {
    if (query.startDate && query.endDate) {
      assertOrderedDateRangeOrThrow(
        parseIsoDateOrThrow(query.startDate, 'startDate'),
        parseIsoDateOrThrow(query.endDate, 'endDate'),
        'startDate',
        'endDate',
      );
    }

    const queryBuilder = this.maintenanceLogsRepository
      .createQueryBuilder('maintenanceLog')
      .leftJoinAndSelect('maintenanceLog.drone', 'drone')
      .andWhere('drone.ownerId = :fleetOwnerId', { fleetOwnerId })
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
        startDate: parseIsoDateOrThrow(query.startDate, 'startDate'),
      });
    }

    if (query.endDate) {
      queryBuilder.andWhere('maintenanceLog.performedAt <= :endDate', {
        endDate: parseIsoDateOrThrow(query.endDate, 'endDate'),
      });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { Audit } from '../common/audit/audit.decorator';
import { WorkspaceContext } from '../common/workspace-context/workspace-context';
import { IMaintenanceLogsRepository } from './repositories/maintenance-logs.repository.interface';
import { IDronesRepository } from '../drones/repositories/drones.repository.interface';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { createReadStream } from 'fs';
import { buildPaginationMeta } from '../common/utils/pagination';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { Drone, DroneStatus } from '../drones/entities/drone.entity';
import { MaintenanceAttachment } from './entities/maintenance-log.entity';
import { ListMaintenanceLogsQueryDto } from './dto/list-maintenance-logs-query.dto';
import { extname, join, basename } from 'path';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'maintenance');
const FLIGHT_HOUR_TOLERANCE = 0.5;

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly maintenanceLogsRepository: IMaintenanceLogsRepository,
    private readonly dronesRepository: IDronesRepository,
    private readonly workspaceContext: WorkspaceContext,
  ) {}

  @Audit({ action: 'MAINTENANCE_LOGGED', entityType: 'MaintenanceLog' })
  async create(createMaintenanceLogDto: CreateMaintenanceLogDto) {
    const fleetOwnerId = this.workspaceContext.fleetOwnerId;
    const drone = await this.dronesRepository.findOne(
      createMaintenanceLogDto.droneId,
      fleetOwnerId,
    );

    if (!drone) {
      throw new NotFoundException(
        `Drone ${createMaintenanceLogDto.droneId} was not found.`,
      );
    }

    MaintenanceService.assertCreatePreconditions(
      drone,
      createMaintenanceLogDto,
    );

    const urlAttachments: MaintenanceAttachment[] = (
      createMaintenanceLogDto.attachmentUrls ?? []
    ).map((url) => ({ type: 'url', url }));

    const maintenanceLog = this.maintenanceLogsRepository.create({
      droneId: drone.id,
      type: createMaintenanceLogDto.type,
      performedAt: new Date(createMaintenanceLogDto.performedAt),
      flightHoursAtMaintenance:
        createMaintenanceLogDto.flightHoursAtMaintenance,
      technicianName: createMaintenanceLogDto.technicianName,
      notes: createMaintenanceLogDto.notes ?? null,
      attachments: urlAttachments,
    });

    const saved = await this.dataSource.transaction(async (manager) => {
      return manager.save(maintenanceLog);
    });

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

  async addFileAttachment(logId: string, file: Express.Multer.File) {
    const fleetOwnerId = this.workspaceContext.fleetOwnerId;
    const log = await this.maintenanceLogsRepository.findOne(logId);

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
    logId: string,
    rawFileName: string,
  ): Promise<StreamableFile> {
    const fleetOwnerId = this.workspaceContext.fleetOwnerId;
    const storedFileName = basename(rawFileName);
    if (
      storedFileName !== rawFileName ||
      !MaintenanceService.STORED_FILE_NAME_REGEX.test(storedFileName)
    ) {
      throw new BadRequestException('Invalid attachment file name.');
    }

    const log = await this.maintenanceLogsRepository.findOne(logId);

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

  async findAll(query: ListMaintenanceLogsQueryDto) {
    const fleetOwnerId = this.workspaceContext.fleetOwnerId;

    const [data, total] = await this.maintenanceLogsRepository.findAll(
      fleetOwnerId,
      {
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        droneId: query.droneId,
        startDate: query.startDate,
        endDate: query.endDate,
      },
    );

    return {
      data,
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }
}

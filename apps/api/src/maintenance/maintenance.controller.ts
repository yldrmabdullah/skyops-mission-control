import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OperatorRole } from '../auth/operator-role.enum';
import type { JwtPayloadUser } from '../auth/strategies/jwt.strategy';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { ListMaintenanceLogsQueryDto } from './dto/list-maintenance-logs-query.dto';
import { MaintenanceService } from './maintenance.service';

const uploadMemory = memoryStorage();

@ApiTags('Maintenance')
@ApiBearerAuth('access-token')
@Controller('maintenance-logs')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @ApiOperation({ summary: 'Create maintenance log' })
  @ApiResponse({ status: 201, description: 'Log created' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Drone not found' })
  @UseGuards(RolesGuard)
  @Roles(OperatorRole.TECHNICIAN, OperatorRole.MANAGER)
  create(
    @CurrentUser() user: JwtPayloadUser,
    @Body() createMaintenanceLogDto: CreateMaintenanceLogDto,
  ) {
    return this.maintenanceService.create(
      createMaintenanceLogDto,
      user.fleetOwnerId,
      user.userId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List maintenance logs' })
  @ApiResponse({ status: 200, description: 'Paginated logs' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @UseGuards(RolesGuard)
  @Roles(OperatorRole.TECHNICIAN, OperatorRole.MANAGER)
  findAll(
    @CurrentUser() user: JwtPayloadUser,
    @Query() query: ListMaintenanceLogsQueryDto,
  ) {
    return this.maintenanceService.findAll(query, user.fleetOwnerId);
  }

  @Post(':id/attachments')
  @ApiOperation({ summary: 'Upload file attachment for a log' })
  @ApiResponse({ status: 201, description: 'Log with new attachment' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @UseGuards(RolesGuard)
  @Roles(OperatorRole.TECHNICIAN, OperatorRole.MANAGER)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: uploadMemory,
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok =
          file.mimetype.startsWith('image/') ||
          file.mimetype === 'application/pdf';
        cb(
          ok
            ? null
            : new BadRequestException(
                'Only images or PDF uploads are allowed.',
              ),
          ok,
        );
      },
    }),
  )
  uploadAttachment(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('File is required.');
    }

    return this.maintenanceService.addFileAttachment(user.userId, id, file);
  }

  @Get(':id/attachments/:storedFileName')
  @ApiOperation({ summary: 'Download uploaded attachment' })
  @ApiProduces(
    'application/octet-stream',
    'image/png',
    'image/jpeg',
    'application/pdf',
  )
  @ApiResponse({ status: 200, description: 'File stream' })
  @ApiResponse({ status: 400, description: 'Invalid file name' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @UseGuards(RolesGuard)
  @Roles(OperatorRole.TECHNICIAN, OperatorRole.MANAGER)
  downloadAttachment(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('storedFileName') storedFileName: string,
  ) {
    return this.maintenanceService.getAttachmentFile(
      user.fleetOwnerId,
      id,
      storedFileName,
    );
  }
}

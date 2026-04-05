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
@UseGuards(RolesGuard)
@Controller('maintenance-logs')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @ApiOperation({ summary: 'Log maintenance performed (Manager only)' })
  @ApiResponse({ status: 201, description: 'Log created' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Drone not found' })
  @Roles(OperatorRole.MANAGER)
  create(@Body() createBatchDto: CreateMaintenanceLogDto) {
    return this.maintenanceService.create(createBatchDto);
  }

  @Get()
  @ApiOperation({ summary: 'List maintenance logs for the operator fleet' })
  @ApiResponse({ status: 200, description: 'Paginated logs' })
  @Roles(OperatorRole.TECHNICIAN, OperatorRole.MANAGER)
  findAll(@Query() query: ListMaintenanceLogsQueryDto) {
    return this.maintenanceService.findAll(query);
  }

  @Post(':id/attachments')
  @ApiOperation({ summary: 'Upload an attachment to a log' })
  @ApiResponse({ status: 201, description: 'Log with new attachment' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @Roles(OperatorRole.MANAGER)
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
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('File is required.');
    }

    return this.maintenanceService.addFileAttachment(id, file);
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
  @Roles(OperatorRole.TECHNICIAN, OperatorRole.MANAGER)
  downloadAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('storedFileName') storedFileName: string,
  ) {
    return this.maintenanceService.getAttachmentFile(id, storedFileName);
  }
}

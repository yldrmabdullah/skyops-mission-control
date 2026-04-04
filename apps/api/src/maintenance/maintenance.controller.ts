import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../auth/strategies/jwt.strategy';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { ListMaintenanceLogsQueryDto } from './dto/list-maintenance-logs-query.dto';
import { MaintenanceService } from './maintenance.service';

@ApiTags('Maintenance')
@ApiBearerAuth('access-token')
@Controller('maintenance-logs')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  create(
    @CurrentUser() user: JwtPayloadUser,
    @Body() createMaintenanceLogDto: CreateMaintenanceLogDto,
  ) {
    return this.maintenanceService.create(createMaintenanceLogDto, user.userId);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayloadUser,
    @Query() query: ListMaintenanceLogsQueryDto,
  ) {
    return this.maintenanceService.findAll(query, user.userId);
  }
}

import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { ListMaintenanceLogsQueryDto } from './dto/list-maintenance-logs-query.dto';
import { MaintenanceService } from './maintenance.service';

@ApiTags('Maintenance')
@Controller('maintenance-logs')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  create(@Body() createMaintenanceLogDto: CreateMaintenanceLogDto) {
    return this.maintenanceService.create(createMaintenanceLogDto);
  }

  @Get()
  findAll(@Query() query: ListMaintenanceLogsQueryDto) {
    return this.maintenanceService.findAll(query);
  }
}

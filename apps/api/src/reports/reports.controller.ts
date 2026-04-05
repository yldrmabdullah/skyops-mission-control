import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('fleet-health')
  @ApiOperation({ summary: 'Fleet health summary' })
  @ApiResponse({ status: 200, description: 'Fleet health report' })
  getFleetHealthReport() {
    return this.reportsService.getFleetHealthReport();
  }

  @Get('operational-analytics')
  @ApiOperation({ summary: 'Operational analytics aggregates' })
  @ApiResponse({
    status: 200,
    description: 'Mission, model, maintenance stats',
  })
  getOperationalAnalytics() {
    return this.reportsService.getOperationalAnalytics();
  }
}

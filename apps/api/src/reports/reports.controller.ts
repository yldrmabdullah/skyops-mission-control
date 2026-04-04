import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../auth/strategies/jwt.strategy';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('fleet-health')
  getFleetHealthReport(@CurrentUser() user: JwtPayloadUser) {
    return this.reportsService.getFleetHealthReport(user.userId);
  }
}

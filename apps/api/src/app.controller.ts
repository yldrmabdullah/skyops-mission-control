import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  @Get('health')
  getHealthStatus() {
    return {
      status: 'ok',
      service: 'skyops-mission-control-api',
      timestamp: new Date().toISOString(),
    };
  }
}

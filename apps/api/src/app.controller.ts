import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('Health')
@SkipThrottle()
@Controller()
export class AppController {
  @Public()
  @Get()
  getApiInfo() {
    return {
      service: 'skyops-mission-control-api',
      status: 'ok',
      docs: '/docs',
      health: '/api/health',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('health')
  getHealthStatus() {
    return {
      status: 'ok',
      service: 'skyops-mission-control-api',
      timestamp: new Date().toISOString(),
    };
  }
}

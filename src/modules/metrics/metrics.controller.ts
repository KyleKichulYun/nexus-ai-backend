import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('connections')
  getConnectionCount() {
    return {
      activeConnections: this.metricsService.getActiveConnections(),
      timestamp: new Date().toISOString(),
    };
  }
}

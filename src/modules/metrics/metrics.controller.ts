import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('connections')
  async getConnectionCount() {
    // async 추가
    const metrics = await this.metricsService.getMetrics(); // await 추가
    return {
      ...metrics,
      timestamp: new Date().toISOString(),
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private activeConnections = 0;

  incrementConnection() {
    this.activeConnections++;
    this.logger.log(`Active connections: ${this.activeConnections}`);
  }

  decrementConnection() {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
    this.logger.log(`Active connections: ${this.activeConnections}`);
  }

  getActiveConnections(): number {
    return this.activeConnections;
  }
}

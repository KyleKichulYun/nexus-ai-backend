import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import * as geoip from 'geoip-lite';
import { PrismaService } from '../prisma/prisma.service'; // 프로젝트 구조에 맞게 경로 수정 필요

@Injectable()
export class MetricsService implements OnModuleDestroy {
  private readonly logger = new Logger(MetricsService.name);
  private readonly redis: Redis;

  // 하이브리드 제어 변수
  private isRedisHealthy = true;
  private readonly SYNC_THRESHOLD = 100;

  constructor(
    private configService: ConfigService,
    private readonly prisma: PrismaService, // DB 연동을 위한 Prisma 주입
  ) {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') || 'redis://127.0.0.1:6379';
    this.redis = new Redis(redisUrl);

    // [Circuit Breaker] Redis 연결 상태 자동 모니터링
    this.redis.on('error', (err) => this.handleRedisError(err));
    this.redis.on('connect', () => {
      if (!this.isRedisHealthy) {
        this.isRedisHealthy = true;
        this.logger.log('Redis connection restored. Returning to normal mode.');
      }
    });
  }

  async incrementConnection(ip: string) {
    const country = this.getCountryFromIp(ip);

    try {
      if (this.isRedisHealthy) {
        const total = await this.redis.incr('metrics:total');
        const countryTotal = await this.redis.hincrby(
          'metrics:country',
          country,
          1,
        );

        this.logger.log(
          `Active [Total: ${total}] | Country [${country}]: ${countryTotal}`,
        );

        // 임계치 도달 시 비동기로 DB 백업 (에러 로깅만 하고 메인 스트림은 방해하지 않음)
        if (total % this.SYNC_THRESHOLD === 0) {
          this.syncToDatabase(total).catch((err: unknown) =>
            this.logger.error(
              'Background DB sync failed',
              err instanceof Error ? err.message : String(err),
            ),
          );
        }
      } else {
        await this.fallbackToDatabase('total_connections', 1);
      }
    } catch (error) {
      this.handleRedisError(error);
      await this.fallbackToDatabase('total_connections', 1);
    }
  }

  async decrementConnection(ip: string) {
    const country = this.getCountryFromIp(ip);

    try {
      if (this.isRedisHealthy) {
        const total = await this.redis.decr('metrics:total');
        if (total < 0) await this.redis.set('metrics:total', 0); // 방어 로직

        const countryTotal = await this.redis.hincrby(
          'metrics:country',
          country,
          -1,
        );
        if (countryTotal <= 0) {
          await this.redis.hdel('metrics:country', country);
        }

        this.logger.log(
          `Active [Total: ${Math.max(0, total)}] | Country [${country}]: ${Math.max(0, countryTotal)}`,
        );

        if (total % this.SYNC_THRESHOLD === 0 && total >= 0) {
          this.syncToDatabase(total).catch((err: unknown) =>
            this.logger.error(
              'Background DB sync failed',
              err instanceof Error ? err.message : String(err),
            ),
          );
        }
      } else {
        await this.fallbackToDatabase('total_connections', -1);
      }
    } catch (error) {
      this.handleRedisError(error);
      await this.fallbackToDatabase('total_connections', -1);
    }
  }

  async getMetrics() {
    try {
      if (this.isRedisHealthy) {
        const total = await this.redis.get('metrics:total');
        const byCountry = await this.redis.hgetall('metrics:country');

        const formattedByCountry = Object.entries(byCountry).reduce(
          (acc, [key, value]) => {
            acc[key] = parseInt(value, 10);
            return acc;
          },
          {} as Record<string, number>,
        );

        return {
          totalConnections: parseInt(total || '0', 10),
          byCountry: formattedByCountry,
        };
      } else {
        return await this.getMetricsFromDatabase();
      }
    } catch (error) {
      this.handleRedisError(error);
      return await this.getMetricsFromDatabase();
    }
  }

  // --- Private Helper Methods ---

  private async syncToDatabase(count: number) {
    await this.prisma.systemMetric.upsert({
      where: { key: 'total_connections' },
      update: { value: count },
      create: { key: 'total_connections', value: count },
    });
    this.logger.log(
      `[Backup] Metrics threshold reached. Synced to DB: ${count}`,
    );
  }

  private async fallbackToDatabase(key: string, delta: number) {
    try {
      // PostgreSQL의 원자적 연산(increment) 활용
      await this.prisma.systemMetric.upsert({
        where: { key },
        update: { value: { increment: delta } },
        create: { key, value: Math.max(0, delta) }, // 최초 생성 시 음수 방지
      });
      this.logger.warn(
        `[Fallback] Metric updated directly in DB: ${key} (${delta > 0 ? '+' : ''}${delta})`,
      );
    } catch (dbError) {
      this.logger.error('CRITICAL: Both Redis and Database are down!', dbError);
    }
  }

  private async getMetricsFromDatabase() {
    try {
      const totalRecord = await this.prisma.systemMetric.findUnique({
        where: { key: 'total_connections' },
      });
      return {
        totalConnections: totalRecord?.value || 0,
        byCountry: { FallbackMode: 1 }, // 장애 시 국가별 데이터는 간소화 응답
      };
    } catch {
      return { totalConnections: 0, byCountry: {} };
    }
  }

  private getCountryFromIp(ip: string): string {
    if (ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1')) {
      return 'KR';
    }

    const geo = geoip.lookup(ip) as { country: string } | null;

    return geo ? geo.country : 'Unknown';
  }

  private handleRedisError(error: unknown) {
    if (this.isRedisHealthy) {
      this.isRedisHealthy = false;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[Circuit Breaker] Redis down. Switching to Database mode. Error: ${errorMessage}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}

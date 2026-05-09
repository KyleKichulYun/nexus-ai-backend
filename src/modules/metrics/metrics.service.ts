import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import * as geoip from 'geoip-lite';

@Injectable()
export class MetricsService implements OnModuleDestroy {
  private readonly logger = new Logger(MetricsService.name);
  private readonly redis: Redis;

  constructor(private configService: ConfigService) {
    // ConfigService를 통해 Redis 주소를 가져옵니다.
    const redisUrl =
      this.configService.get<string>('REDIS_URL') || 'redis://127.0.0.1:6379';
    this.redis = new Redis(redisUrl);
  }

  async incrementConnection(ip: string) {
    const country = this.getCountryFromIp(ip);

    // 원자적 연산으로 Redis 카운트 증가
    const total = await this.redis.incr('metrics:total');
    const countryTotal = await this.redis.hincrby(
      'metrics:country',
      country,
      1,
    );

    this.logger.log(
      `Active [Total: ${total}] | Country [${country}]: ${countryTotal}`,
    );
  }

  async decrementConnection(ip: string) {
    const country = this.getCountryFromIp(ip);

    // 원자적 연산으로 Redis 카운트 감소
    const total = await this.redis.decr('metrics:total');
    if (total < 0) await this.redis.set('metrics:total', 0); // 방어 로직

    const countryTotal = await this.redis.hincrby(
      'metrics:country',
      country,
      -1,
    );

    // 0이 된 국가는 Hash에서 깔끔하게 삭제
    if (countryTotal <= 0) {
      await this.redis.hdel('metrics:country', country);
    }

    this.logger.log(
      `Active [Total: ${Math.max(0, total)}] | Country [${country}]: ${Math.max(0, countryTotal)}`,
    );
  }

  async getMetrics() {
    // 다건의 데이터를 한 번에 가져옴
    const total = await this.redis.get('metrics:total');
    const byCountry = await this.redis.hgetall('metrics:country');

    // Redis HGETALL은 문자열로 반환하므로 숫자로 변환
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
  }

  private getCountryFromIp(ip: string): string {
    if (ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1')) {
      return 'KR';
    }
    // 외부 라이브러리의 타입 추론 한계를 명시적으로 예외 처리하고 안전하게 사용합니다.
    const geo = geoip.lookup(ip) as { country: string } | null;

    return geo ? geo.country : 'Unknown';
  }

  // Redis 종료 시의 Floating Promise 문제 해결 (async/await 추가)
  async onModuleDestroy() {
    await this.redis.quit();
  }
}

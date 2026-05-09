import { Injectable, Logger } from '@nestjs/common';
import * as geoip from 'geoip-lite';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private totalConnections = 0;
  private countryConnections: Record<string, number> = {};

  incrementConnection(ip: string) {
    this.totalConnections++;
    const country = this.getCountryFromIp(ip);

    this.countryConnections[country] =
      (this.countryConnections[country] || 0) + 1;
    this.logger.log(
      `Active [Total: ${this.totalConnections}] | Country [${country}]: ${this.countryConnections[country]}`,
    );
  }

  decrementConnection(ip: string) {
    this.totalConnections = Math.max(0, this.totalConnections - 1);
    const country = this.getCountryFromIp(ip);

    if (this.countryConnections[country]) {
      this.countryConnections[country] = Math.max(
        0,
        this.countryConnections[country] - 1,
      );

      // 메모리 누수 방지를 위해 카운트가 0이 된 국가는 객체에서 제거
      if (this.countryConnections[country] === 0) {
        delete this.countryConnections[country];
      }
    }
    this.logger.log(
      `Active [Total: ${this.totalConnections}] | Country [${country}]: ${this.countryConnections[country] || 0}`,
    );
  }

  getMetrics() {
    return {
      totalConnections: this.totalConnections,
      byCountry: this.countryConnections,
    };
  }

  /**
   * IP 주소를 기반으로 ISO 3166-1 alpha-2 국가 코드를 반환합니다.
   */
  private getCountryFromIp(ip: string): string {
    // 로컬 환경 테스트를 위한 예외 처리 (로컬 IP는 위치 정보가 없음)
    if (ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1')) {
      return 'KR'; // 테스트를 위해 한국으로 기본값 설정
    }

    const geo = geoip.lookup(ip);
    return geo ? geo.country : 'Unknown';
  }
}

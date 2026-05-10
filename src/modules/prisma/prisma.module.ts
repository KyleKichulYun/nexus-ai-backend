import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 1. 프로젝트 전역에서 사용할 수 있게 만들어줍니다.
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // 2. 외부(MetricsService 등)에서 주입받을 수 있도록 내보냅니다!
})
export class PrismaModule {}

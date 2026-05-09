import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './modules/ai-provider/ai.module';
import { ChatModule } from './modules/chat/chat.module';
import { MetricsModule } from './modules/metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Doppler가 주입한 고유 환경 변수가 존재하면 .env를 무시합니다.
      ignoreEnvFile: process.env.DOPPLER_ENVIRONMENT !== undefined,
    }),
    AiModule,
    ChatModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

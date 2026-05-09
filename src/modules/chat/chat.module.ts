import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AiModule } from '../ai-provider/ai.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  // AiModule을 import해야 AI_SERVICE_TOKEN을 주입받을 수 있습니다.
  imports: [AiModule, MetricsModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AI_SERVICE_TOKEN } from './interfaces/ai-service.interface';
import { OpenAiService } from './providers/openai.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      // 다른 AI 모델(예: AnthropicService)로 교체할 경우 이 부분만 수정하면 됩니다.
      provide: AI_SERVICE_TOKEN,
      useClass: OpenAiService, 
    },
  ],
  // 다른 모듈(Chat 등)에서 주입받을 수 있도록 Token을 export 합니다.
  exports: [AI_SERVICE_TOKEN], 
})
export class AiModule {}
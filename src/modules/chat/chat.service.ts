import { Injectable, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  AI_SERVICE_TOKEN,
  IAiService,
} from '../ai-provider/interfaces/ai-service.interface';

@Injectable()
export class ChatService {
  constructor(
    @Inject(AI_SERVICE_TOKEN)
    private readonly aiService: IAiService,
  ) {}

  /**
   * AI에게 메시지를 보내고 스트리밍 응답을 Observable로 반환합니다.
   */
  streamChatResponse(message: string): Observable<string> {
    // 향후 시스템 프롬프트나 유저 세션 정보 등을 여기서 조합할 수 있습니다.
    const systemPrompt =
      'You are a helpful and highly skilled AI backend developer.';
    const fullPrompt = `${systemPrompt}\n\nUser: ${message}`;

    return this.aiService.generateStream(fullPrompt, {
      temperature: 0.7,
      maxTokens: 1000,
    });
  }
}

import { Controller, Query, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';
import { ChatService } from './chat.service';
import { MetricsService } from '../metrics/metrics.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly metricsService: MetricsService, // 의존성 주입
  ) {}

  @Sse('stream')
  stream(@Query('message') message: string): Observable<MessageEvent> {
    if (!message) {
      return new Observable<MessageEvent>((subscriber) => {
        subscriber.next({ data: 'Message is required.' });
        subscriber.complete();
      });
    }

    // 클라이언트가 엔드포인트에 접속하면 카운트 증가
    this.metricsService.incrementConnection();

    return this.chatService.streamChatResponse(message).pipe(
      map((chunk) => ({
        data: chunk,
      })),
      // 응답이 완료되거나 클라이언트가 연결을 끊으면 카운트 감소
      finalize(() => {
        this.metricsService.decrementConnection();
      }),
    );
  }
}

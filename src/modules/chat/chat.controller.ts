import { Controller, Query, Sse, MessageEvent, Ip } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';
import { ChatService } from './chat.service';
import { MetricsService } from '../metrics/metrics.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly metricsService: MetricsService,
  ) {}

  @Sse('stream')
  stream(
    @Query('message') message: string,
    @Ip() ip: string, // 클라이언트 IP 추출
  ): Observable<MessageEvent> {
    if (!message) {
      return new Observable<MessageEvent>((subscriber) => {
        subscriber.next({ data: 'Message is required.' });
        subscriber.complete();
      });
    }

    this.metricsService.incrementConnection(ip); // IP 전달

    return this.chatService.streamChatResponse(message).pipe(
      map((chunk) => ({ data: chunk })),
      finalize(() => {
        this.metricsService.decrementConnection(ip); // IP 전달
      }),
    );
  }
}

import {
  Controller,
  Query,
  Sse,
  MessageEvent,
  Ip,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';
import { ChatService } from './chat.service';
import { MetricsService } from '../metrics/metrics.service';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly metricsService: MetricsService,
  ) {}

  @Sse('stream')
  stream(
    @Query('message') message: string,
    @Ip() ip: string,
  ): Observable<MessageEvent> {
    if (!message) {
      return new Observable<MessageEvent>((subscriber) => {
        subscriber.next({ data: 'Message is required.' });
        subscriber.complete();
      });
    }

    // 1. 에러 타입을 검증하는 방어적 로직 추가
    this.metricsService.incrementConnection(ip).catch((err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to increment connection metrics: ${errorMessage}`,
      );
    });

    return this.chatService.streamChatResponse(message).pipe(
      map((chunk) => ({
        data: chunk,
      })),
      finalize(() => {
        // 2. 에러 타입을 검증하는 방어적 로직 추가
        this.metricsService.decrementConnection(ip).catch((err: unknown) => {
          const errorMessage = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `Failed to decrement connection metrics: ${errorMessage}`,
          );
        });
      }),
    );
  }
}

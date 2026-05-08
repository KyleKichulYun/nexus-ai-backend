import { Controller, Query, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * GET /chat/stream?message=your_prompt
   * 클라이언트가 이 엔드포인트를 호출하면 SSE 연결이 열립니다.
   */
  @Sse('stream')
  stream(@Query('message') message: string): Observable<MessageEvent> {
    if (!message) {
      // 메시지가 없을 경우 빈 스트림 반환 또는 에러 처리
      return new Observable<MessageEvent>((subscriber) => {
        subscriber.next({ data: 'Message is required.' });
        subscriber.complete();
      });
    }

    return this.chatService.streamChatResponse(message).pipe(
      map(
        (chunk) =>
          ({
            // SSE 표준 포맷인 { data: ... } 형태로 변환
            data: chunk,
          }),
      ),
    );
  }
}

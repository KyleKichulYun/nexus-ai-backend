import { Controller, Query, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Sse('stream')
  stream(@Query('message') message: string): Observable<MessageEvent> {
    if (!message) {
      return new Observable<MessageEvent>((subscriber) => {
        subscriber.next({ data: 'Message is required.' });
        subscriber.complete();
      });
    }

    return this.chatService.streamChatResponse(message).pipe(
      map((chunk) => ({
        data: chunk,
      })), // 'as MessageEvent' 제거됨
    );
  }
}

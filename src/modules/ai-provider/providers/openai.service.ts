import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAiService } from '../interfaces/ai-service.interface';
import { Observable } from 'rxjs';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService implements IAiService {
  private readonly openai: OpenAI;

  constructor(private configService: ConfigService) {
    // ConfigService를 통해 환경변수에서 API 키를 안전하게 가져옵니다.
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateText(prompt: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: this.configService.get<string>('AI_MODEL') || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });
    return response.choices[0].message.content || '';
  }

  generateStream(prompt: string): Observable<string> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          const stream = await this.openai.chat.completions.create({
            model: this.configService.get<string>('AI_MODEL') || 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            stream: true, // 스트리밍 활성화
          });

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              subscriber.next(content);
            }
          }
          subscriber.complete();
        } catch (error) {
          subscriber.error(error);
        }
      })();
    });
  }
}
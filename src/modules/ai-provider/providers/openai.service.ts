import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAiService, AiCallOptions } from '../interfaces/ai-service.interface'; // AiCallOptions 임포트 추가
import { Observable } from 'rxjs';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService implements IAiService {
  private readonly openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  // 1. options 파라미터 추가
  async generateText(prompt: string, options?: AiCallOptions): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model:
        options?.model ||
        this.configService.get<string>('AI_MODEL') ||
        'gpt-4o',
      temperature: options?.temperature, // 옵션이 있으면 적용
      max_tokens: options?.maxTokens, // 옵션이 있으면 적용
      messages: [{ role: 'user', content: prompt }],
    });
    return response.choices[0].message.content || '';
  }

  // 2. options 파라미터 추가
  generateStream(prompt: string, options?: AiCallOptions): Observable<string> {
    return new Observable((subscriber) => {
      void (async () => {
        try {
          const stream = await this.openai.chat.completions.create({
            model:
              options?.model ||
              this.configService.get<string>('AI_MODEL') ||
              'gpt-4o',
            temperature: options?.temperature, // 옵션 추가
            max_tokens: options?.maxTokens, // 옵션 추가
            messages: [{ role: 'user', content: prompt }],
            stream: true,
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

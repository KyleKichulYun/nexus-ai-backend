import { Observable } from 'rxjs';

export const AI_SERVICE_TOKEN = Symbol('AI_SERVICE_TOKEN');

// 옵션 타입 정의 추가
export interface AiCallOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface IAiService {
  generateText(prompt: string, options?: AiCallOptions): Promise<string>;

  // 두 번째 파라미터로 options를 받을 수 있도록 수정
  generateStream(prompt: string, options?: AiCallOptions): Observable<string>;
}

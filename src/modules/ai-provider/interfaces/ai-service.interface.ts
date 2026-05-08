import { Observable } from 'rxjs';

// NestJS DI 컨테이너에서 사용할 고유 토큰
export const AI_SERVICE_TOKEN = Symbol('AI_SERVICE_TOKEN');

export interface IAiService {
  /**
   * 단일 텍스트 응답을 생성합니다. (일반적인 REST API 용도)
   */
  generateText(prompt: string): Promise<string>;

  /**
   * SSE 스트리밍을 위한 텍스트 청크를 Observable로 반환합니다.
   */
  generateStream(prompt: string): Observable<string>;
}
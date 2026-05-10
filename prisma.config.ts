// 위치: 프로젝트 루트의 prisma.config.ts
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  // 객체가 아닌 '문자열'로 경로를 바로 적어줍니다!
  schema: 'prisma/schema.prisma',

  // migrate 객체는 표준 경로(prisma/migrations)를 쓰신다면
  // 생략하는 것이 오히려 에러 방지에 좋습니다.

  datasource: {
    url: process.env.DATABASE_URL,
  },
});

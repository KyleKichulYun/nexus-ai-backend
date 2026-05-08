# 1. Builder Stage (빌드 환경)
FROM node:20-alpine AS builder

WORKDIR /app

# 패키지 매니저 파일 복사 및 종속성 설치
COPY package*.json ./
RUN npm ci

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# 프로덕션 종속성만 따로 설치 (이미지 경량화 목적)
RUN npm ci --only=production && npm cache clean --force

# ---------------------------------------------------

# 2. Production Stage (실행 환경)
FROM node:20-alpine AS production

# 보안을 위해 Node.js 기본 비루트 유저 사용
USER node
WORKDIR /app

# 런타임 환경 설정
ENV NODE_ENV=production

# 빌더 스테이지에서 필요한 결과물만 복사
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

EXPOSE 3000

# Doppler 없이 컨테이너 내부에서 직접 실행하는 엔트리포인트
# (환경 변수는 docker-compose나 k8s Secret을 통해 주입받도록 설계)
CMD ["node", "dist/main"]
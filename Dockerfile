# Stage 1: Base
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# Prisma 엔진 실행을 위한 보안 라이브러리 설치
RUN apk add --no-cache openssl

# Stage 2: Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# prisma 스키마 파일 복사 (의존성 설치 시 postinstall로 generate가 실행될 수 있음)
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile

# Stage 3: Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 1. Prisma Client 생성 (타입 안정성 확보)
RUN pnpm prisma generate
# 2. Nest.js 빌드
RUN pnpm run build

# Stage 4: Runner
FROM node:20-alpine AS runner
WORKDIR /app
# 실행 환경에서도 openssl 필요
RUN apk add --no-cache openssl

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

# 컨테이너 시작 시 DB 마이그레이션이 필요한 경우를 위해 CMD 구성
# (실제 배포 전략에 따라 마이그레이션 단계는 분리하는 것이 좋습니다)
CMD ["node", "dist/main"]
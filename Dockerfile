FROM node:24-slim

WORKDIR /usr/src/app

# 헬스 체크를 위한 curl 설치
RUN apt-get update -y && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# 이미 빌드된 파일들 복사 (GitHub Actions에서 빌드됨)
COPY dist ./dist
COPY generated ./generated
COPY package.json ./
COPY prisma ./prisma

# 프로덕션 의존성만 설치 (런타임에 필요한 것만)
RUN npm i -g pnpm && \
    pnpm install --prod --frozen-lockfile

# 헬스 체크 설정
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

EXPOSE 4000

CMD ["node", "dist/main.js"]
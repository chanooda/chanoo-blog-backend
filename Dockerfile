FROM node:24-slim

WORKDIR /usr/src/app

# 헬스 체크를 위한 curl 설치
RUN apt-get update -y && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# 이미 빌드된 파일들 복사 (GitHub Actions에서 빌드됨)
COPY dist ./dist
COPY generated ./generated
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY prisma ./prisma
COPY .env ./

# 프로덕션 의존성만 설치 (런타임에 필요한 것만)
RUN npm i -g pnpm && \
    pnpm install --prod --frozen-lockfile && \
    pnpm exec prisma generate

EXPOSE 4000

CMD ["node", "dist/main.js"]
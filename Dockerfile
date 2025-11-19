FROM node:24-slim

WORKDIR /usr/src/app

# 헬스 체크를 위한 curl 설치
RUN apt-get update -y && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY generated ./generated
COPY dist ./dist
COPY prisma ./prisma
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY .env ./

# 프로덕션 의존성만 설치 (런타임에 필요한 것만)
RUN npm i -g pnpm 
RUN pnpm install --prod --frozen-lockfile
RUN pnpm exec prisma migrate deploy
    
EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
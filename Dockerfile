FROM node:18-slim

# 앱 디렉터리 생성
WORKDIR /usr/src/app

# 앱 소스 추가
COPY . .

RUN npm i -g pnpm
RUN pnpm install
# 프로덕션을 위한 코드를 빌드하는 경우
# RUN npm ci --only=production

EXPOSE 4000
CMD [ "nohup", "pnpm", "start", "&" ]
FROM node:18-slim

WORKDIR /usr/src/app

COPY . .


RUN apt-get update -y
RUN apt-get install -y openssl
RUN npm i -g pnpm
RUN pnpm install
RUN prisma generate

EXPOSE 4000
CMD ["nohup", "node", "dist/main.js", "&"]
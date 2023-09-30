FROM node:18-slim

WORKDIR /usr/src/app

COPY . .

RUN chmod +x ./after-run-docker.sh

RUN npm i -g pnpm

EXPOSE 4000
CMD ["nohup","./after-run-docker.sh", "&"]
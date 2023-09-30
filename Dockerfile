FROM node:18-slim

WORKDIR /usr/src/app

COPY . .

RUN chmod +x ./after-run-docker.sh

RUN npm i -g pnpm
RUN pnpm install

EXPOSE 4000
CMD ["nohup", "node", "dist/main.js", "&"]
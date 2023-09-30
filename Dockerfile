FROM node:18-slim

WORKDIR /usr/src/app

COPY . .


RUN npm i -g pnpm
RUN pnpm install

EXPOSE 4000
CMD ["nohup", "node", "dist/main.js", "&"]
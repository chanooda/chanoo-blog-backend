FROM node:18-slim

WORKDIR /usr/src/app

COPY . .


RUN apt-get update -y
RUN apt-get install -y openssl
RUN npm i -g pnpm


EXPOSE 4000
RUN chmod +x docker-entrypoint.sh 
CMD ["nohup" ,"./docker-entrypoint.sh", "&"]
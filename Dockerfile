
FROM node:14-alpine

WORKDIR /app

COPY ["package.json", "/app/"]

# Install app dependencies

RUN npm install --production --registry=https://registry.npm.taobao.org

ENV NPM_CONFIG_LOGLEVEL warn
ENV NODE_ENV=production
ENV NODE_Docker=docker

COPY server /app/server

# 声明容器使用的端口
EXPOSE 9010


CMD ["npm", "run", "start"]

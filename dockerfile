FROM node:18-alpine

WORKDIR /app
COPY . .

CMD "npm install"

RUN [ "node", "server.js" ]
EXPOSE 3000
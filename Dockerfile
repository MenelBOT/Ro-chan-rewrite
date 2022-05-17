FROM node:17.7.1

WORKDIR /app

COPY ./app .

RUN npm install

CMD [ "npm", "start" ]
FROM node:20-bookworm

WORKDIR /opt/linksort

COPY ./frontend/package.json ./frontend/yarn.lock ./

RUN yarn

COPY ./frontend .

EXPOSE 3000

CMD ["yarn", "start"]

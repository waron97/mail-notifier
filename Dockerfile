FROM node:20

WORKDIR /usr/app
COPY yarn.lock package.json ./
RUN yarn

COPY . .

CMD [ "yarn", "run", "exec" ]
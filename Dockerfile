FROM node:current-alpine
WORKDIR /app

RUN apk add python2 g++ make

#Prebuild better-sqlite3
RUN npm i better-sqlite3@5.4.2

COPY . .

RUN npm i

RUN mv ./node_modules/@types/jsonstream ./node_modules/@types/JSONStream

RUN npm run build-backend
RUN npm run build-frontend

FROM node:current-alpine
WORKDIR /app

RUN apk add ffmpeg

COPY --from=0 /app/node_modules node_modules
COPY --from=0 /app/package.json .
COPY --from=0 /app/client client
COPY --from=0 /app/backend/build .

EXPOSE 80 443
CMD [ "npm", "start" ]
FROM node:23

RUN apt-get update && apt-get install -y make g++ python3 \
postgresql-client-common && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./

RUN npm install --prefer-offline
RUN npm install -g pm2

COPY . .
EXPOSE 8082

RUN npm run build

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
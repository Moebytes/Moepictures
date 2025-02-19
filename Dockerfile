FROM node:23

RUN apt-get update && apt-get install -y make g++ python3 \
postgresql-client-common && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./

RUN npm install --prefer-offline --omit=dev
RUN npm install -g pm2

COPY . .
EXPOSE 8082

CMD ["npm", "run", "pm2"]
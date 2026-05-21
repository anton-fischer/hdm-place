FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

COPY prisma ./prisma

RUN npm ci --only=production

RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD npx prisma db push --accept-data-loss && node dist/index.js
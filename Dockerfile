# ---- Stage 1: build ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npx prisma generate

COPY src ./src
RUN npm run build

# ---- Stage 2: production ----
FROM node:22-alpine AS production

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/generated ./generated
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN mkdir -p uploads/menu-items uploads/event-posters uploads/feedback-photos uploads/establishment-profiles

ENV NODE_ENV=production

EXPOSE 3004

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]

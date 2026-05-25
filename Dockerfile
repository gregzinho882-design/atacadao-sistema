FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json tsconfig.json ./
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/
COPY artifacts/atacadao/ ./artifacts/atacadao/
COPY scripts/ ./scripts/

RUN pnpm install --frozen-lockfile

ENV NODE_ENV=production BASE_PATH=/ PORT=3000
RUN pnpm --filter @workspace/atacadao run build
RUN pnpm --filter @workspace/api-server run build

FROM node:20-alpine AS production
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json tsconfig.json ./
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/
COPY scripts/ ./scripts/

RUN pnpm install --frozen-lockfile

COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/atacadao/dist/public ./public

COPY docker-start.sh /docker-start.sh
RUN chmod +x /docker-start.sh

EXPOSE 3000
CMD ["/docker-start.sh"]

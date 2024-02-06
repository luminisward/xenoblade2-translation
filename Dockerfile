FROM node:20-alpine as builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/bdat/package.json ./packages/bdat/
COPY packages/app/package.json ./packages/app/

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store/v3 \
    pnpm install --frozen-lockfile

COPY . ./

RUN cd packages/bdat && pnpm build && pnpm build:db
RUN cd packages/app && pnpm build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/packages/app/.output /app/.output
COPY --from=builder /app/packages/bdat/dist/data.db /app/data.db

ENV NUXT_DB_PATH=/app/data.db

EXPOSE 3000

USER node

CMD ["node", ".output/server/index.mjs"]
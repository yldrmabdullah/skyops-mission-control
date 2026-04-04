FROM node:22-alpine AS builder

WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --frozen-lockfile

COPY apps/web apps/web

RUN pnpm --filter @skyops/web build

FROM nginx:1.27-alpine AS runner

COPY --from=builder /workspace/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

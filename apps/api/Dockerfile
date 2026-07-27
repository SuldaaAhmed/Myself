# syntax=docker/dockerfile:1
# Multi-stage build for the NestJS API. Run from the repository root:
#   docker build -f apps/api/Dockerfile -t aurora-api .

FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @aurora/api --include-workspace-root

FROM deps AS build
WORKDIR /app
COPY apps/api ./apps/api
RUN npm run prisma:generate -w @aurora/api \
 && npm run build -w @aurora/api

# Reinstall without dev dependencies, then re-generate the Prisma client.
FROM node:22-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl tini
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev --workspace @aurora/api --include-workspace-root

COPY apps/api/prisma ./apps/api/prisma
RUN npx prisma generate --schema apps/api/prisma/schema.prisma

COPY --from=build /app/apps/api/dist ./apps/api/dist

RUN addgroup -S app && adduser -S app -G app \
 && mkdir -p /app/uploads && chown -R app:app /app/uploads
USER app

EXPOSE 4000
ENTRYPOINT ["/sbin/tini", "--"]
# Migrations run on boot so a fresh container converges on the current schema.
CMD ["sh", "-c", "npx prisma migrate deploy --schema apps/api/prisma/schema.prisma && node apps/api/dist/main.js"]

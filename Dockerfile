# Imagen de producción para Coolify. Next.js en modo standalone, puerto 3000.
# Variables en runtime: PROTO_CODE_FUND, PROTO_CODE_CONTRATOS, PROTO_CODE_DESARROLLO (opcional NEXT_PUBLIC_DEMO en build).

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Dependencias. En local pnpm instala en node_modules.nosync por iCloud; en la imagen se usa node_modules normal.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY scripts ./scripts
RUN sed -i '/^modulesDir:/d' pnpm-workspace.yaml \
  && pnpm install --frozen-lockfile

FROM base AS builder
ARG NEXT_PUBLIC_DEMO
ENV NEXT_PUBLIC_DEMO=$NEXT_PUBLIC_DEMO
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN sed -i '/^modulesDir:/d' pnpm-workspace.yaml \
  && NEXT_OUTPUT=standalone pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1
CMD ["node", "server.js"]

# ---------- build ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY apps/web/package.json ./
RUN npm install --no-audit --no-fund

COPY apps/web/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

# output: 'standalone' já traz só as dependências efetivamente usadas
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

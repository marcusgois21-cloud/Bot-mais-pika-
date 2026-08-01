# ---------- build ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY apps/api/package.json ./
RUN npm install --no-audit --no-fund

COPY apps/api/tsconfig.json ./
COPY apps/api/src ./src
RUN npx nest build

# ---------- runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# dumb-init garante que SIGTERM chegue ao Node (shutdown limpo da fila)
RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs obraia

COPY apps/api/package.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/uploads && chown -R obraia:nodejs /app
USER obraia

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

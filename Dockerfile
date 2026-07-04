# ---- deps: 依存関係だけを先にインストール(キャッシュを効かせるため) ----
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: next build を実行 ----
FROM node:20-slim AS builder
WORKDIR /app
ARG BACKEND_URL=http://localhost:8277
ENV BACKEND_URL=${BACKEND_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner: standalone 出力だけを積んだ実行用イメージ ----
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# standalone には依存関係が同梱された server.js 一式が入っている
COPY --from=builder /app/.next/standalone ./
# 静的アセットは standalone に含まれないため個別にコピーする
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENTRYPOINT ["node", "server.js"]
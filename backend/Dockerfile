# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Production ─────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && \
    npm install --include=optional sharp 2>/dev/null || true

COPY --from=builder /app/dist ./dist
COPY ecosystem.config.js ./

# Ensure uploads directory exists
RUN mkdir -p uploads/products

EXPOSE 4000
CMD ["node", "dist/index.js"]

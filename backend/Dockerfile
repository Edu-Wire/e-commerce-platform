# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Add build tools needed for native modules (sharp, etc.)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Stage 2: Production ─────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Add build tools for sharp in production too
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

# Ensure uploads directory exists
RUN mkdir -p uploads/products

EXPOSE 4000
CMD ["node", "dist/index.js"]

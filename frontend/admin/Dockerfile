# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://43.204.158.70:4000
ENV VITE_API_URL=$VITE_API_URL

RUN NODE_OPTIONS="--max-old-space-size=512" npm run build

# ── Stage 2: Serve with Nginx ────────────────────────────────────
FROM nginx:1.25-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Production Dockerfile for React + Vite Frontend
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build the Vite application
RUN npm run build

# Production image with nginx
FROM nginx:alpine AS runner

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5173/ || exit 1

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]

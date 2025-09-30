# Multi-stage Dockerfile for Brisa Cubana API
# Optimized for production deployment

# Stage 1: Dependencies
FROM node:24.9.0-alpine AS deps
WORKDIR /app

# Enable Corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod --filter=@brisa/api

# Stage 2: Builder
FROM node:24.9.0-alpine AS builder
WORKDIR /app

# Enable Corepack
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api ./apps/api

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile --filter=@brisa/api...

# Generate Prisma Client
RUN cd apps/api && pnpm db:generate

# Build the application
RUN cd apps/api && pnpm build

# Stage 3: Production runner
FROM node:24.9.0-alpine AS runner
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nodejs:nodejs /app/apps/api/node_modules ./apps/api/node_modules

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/package.json ./apps/api/
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/src/generated ./apps/api/src/generated

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Set environment
ENV NODE_ENV=production
ENV API_PORT=3001

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/server.js"]

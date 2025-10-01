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

# Install production dependencies only (ignore lifecycle scripts)
RUN pnpm install --frozen-lockfile --prod --filter=@brisa/api --ignore-scripts

# Stage 2: Builder (compile TypeScript)
FROM node:24.9.0-alpine AS builder
WORKDIR /app

# Enable Corepack
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api ./apps/api

# Install all dependencies required to build the API (including dev deps)
RUN pnpm install --frozen-lockfile --filter=@brisa/api... --ignore-scripts

# Generate Prisma Client and compile TypeScript to JavaScript output
RUN cd apps/api && pnpm db:generate && pnpm build

# Stage 3: Production runner
FROM node:24.9.0-alpine AS runner
WORKDIR /app

# Enable Corepack
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy workspace configuration for monorepo
COPY --chown=nodejs:nodejs package.json pnpm-workspace.yaml ./

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nodejs:nodejs /app/apps/api/node_modules ./apps/api/node_modules

# Install tsx globally for production runtime
RUN npm install -g tsx@4.20.6

# Copy runtime artifacts
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/package.json ./apps/api/
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/src ./apps/api/src

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check (using fetch for ES modules compatibility)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node --input-type=module -e "fetch('http://localhost:3001/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Set environment variables
ENV NODE_ENV=production
ENV API_PORT=3001

# Start application with tsx (TypeScript execution)
ENTRYPOINT ["dumb-init", "--"]
CMD ["tsx", "apps/api/src/server.ts"]
